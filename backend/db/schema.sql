-- ==============================================================================
-- CIVICFIX SUPABASE DATABASE SCHEMA (FULL CLOSED-LOOP ACCOUNTABILITY)
-- Extensions: PostGIS (Geospatial) + pgvector (Visual CLIP Embeddings)
-- ==============================================================================

-- 1. Enable Required Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";
create extension if not exists "vector";

-- 2. User Profiles Table (Citizen vs MCD / Govt Officials)
create table if not exists profiles (
    id uuid primary key default gen_random_uuid(),
    auth_user_id uuid, -- Optional reference to Supabase auth.users
    full_name text not null,
    email text unique,
    phone text,
    role text not null default 'citizen' check (role in ('citizen', 'official', 'admin')),
    department text, -- For officials (e.g. 'Roads & Works', 'Sanitation', 'Electricity', 'Drainage')
    official_badge_id text, -- Govt ID / Badge number
    civic_points integer not null default 10, -- Gamification points for citizens
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 3. Incident Clusters Table (Aggregated Real-World Problem)
create table if not exists incidents (
    id uuid primary key default gen_random_uuid(),
    category text not null,
    title text,
    description text,
    status text not null default 'OPEN' check (
        status in (
            'OPEN', 
            'IN_PROGRESS', 
            'RESOLVED_PENDING_VERIFICATION', 
            'CLOSED_VERIFIED', 
            'DISPUTED_REOPENED', 
            'REJECTED'
        )
    ),
    priority_score integer not null default 0,
    base_severity integer not null default 1,
    duplicate_count integer not null default 0,
    total_reports integer not null default 1,
    primary_image_url text not null,
    embedding vector(512),
    location geography(POINT, 4326),
    latitude double precision not null,
    longitude double precision not null,
    address text,
    
    -- Govt / MCD Assignment & Resolution
    assigned_department text,
    assigned_officer_id uuid references profiles(id),
    assigned_officer_name text,
    
    -- "After-Repair" Official Proof
    resolution_image_url text,
    resolution_notes text,
    resolved_by_official_id uuid references profiles(id),
    resolved_at timestamptz,

    -- Citizen Verification (YES/NO Closed Loop)
    citizen_feedback_yes integer not null default 0,
    citizen_feedback_no integer not null default 0,
    citizen_verified_status text default 'PENDING' check (citizen_verified_status in ('PENDING', 'CONFIRMED', 'DISPUTED')),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 4. Citizen Complaint Reports Table (Individual Citizen Submissions)
create table if not exists complaint_reports (
    id uuid primary key default gen_random_uuid(),
    incident_id uuid references incidents(id) on delete cascade,
    citizen_id text,
    citizen_profile_id uuid references profiles(id),
    image_url text not null,
    embedding vector(512),
    latitude double precision not null,
    longitude double precision not null,
    location geography(POINT, 4326),
    description text,
    detected_category text not null,
    confidence double precision,
    is_duplicate boolean not null default false,
    created_at timestamptz not null default now()
);

-- 5. Citizen Resolution Feedbacks Table (YES / NO Verification Votes)
create table if not exists incident_feedbacks (
    id uuid primary key default gen_random_uuid(),
    incident_id uuid not null references incidents(id) on delete cascade,
    citizen_id text not null, -- Citizen identifier
    citizen_profile_id uuid references profiles(id),
    is_fixed boolean not null, -- TRUE for YES (Fixed), FALSE for NO (Not Fixed)
    comment text,
    created_at timestamptz not null default now(),
    constraint unique_citizen_incident_feedback unique (incident_id, citizen_id)
);

-- 6. Spatial, Vector, and Query Indexes
create index if not exists idx_incidents_location on incidents using gist (location);
create index if not exists idx_complaints_location on complaint_reports using gist (location);
create index if not exists idx_incidents_status on incidents(status);
create index if not exists idx_incidents_category on incidents(category);
create index if not exists idx_incidents_priority on incidents(priority_score desc);
create index if not exists idx_feedbacks_incident on incident_feedbacks(incident_id);
create index if not exists idx_incidents_embedding on incidents using hnsw (embedding vector_cosine_ops);

-- 7. Triggers for Geography Point & Timestamps
create or replace function set_geography_location()
returns trigger as $$
begin
    new.location := ST_SetSRID(ST_MakePoint(new.longitude, new.latitude), 4326)::geography;
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_incidents_location on incidents;
create trigger trg_incidents_location
before insert or update of latitude, longitude on incidents
for each row execute function set_geography_location();

drop trigger if exists trg_complaints_location on complaint_reports;
create trigger trg_complaints_location
before insert or update of latitude, longitude on complaint_reports
for each row execute function set_geography_location();

create or replace function set_updated_at()
returns trigger as $$
begin
    new.updated_at := now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_incidents_updated_at on incidents;
create trigger trg_incidents_updated_at
before update on incidents
for each row execute function set_updated_at();

-- 8. Trigger: Automatically update YES/NO tallies and status when citizen votes
create or replace function update_incident_feedback_stats()
returns trigger as $$
declare
    yes_count int;
    no_count int;
    target_inc_id uuid;
begin
    target_inc_id := coalesce(new.incident_id, old.incident_id);

    select count(*) filter (where is_fixed = true) into yes_count
    from incident_feedbacks where incident_id = target_inc_id;

    select count(*) filter (where is_fixed = false) into no_count
    from incident_feedbacks where incident_id = target_inc_id;

    update incidents
    set citizen_feedback_yes = yes_count,
        citizen_feedback_no = no_count,
        status = case 
            when no_count > 0 and no_count >= yes_count then 'DISPUTED_REOPENED'
            when yes_count >= 1 and no_count = 0 then 'CLOSED_VERIFIED'
            else status
        end,
        citizen_verified_status = case
            when no_count > 0 and no_count >= yes_count then 'DISPUTED'
            when yes_count >= 1 and no_count = 0 then 'CONFIRMED'
            else 'PENDING'
        end
    where id = target_inc_id;

    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_feedback_update on incident_feedbacks;
create trigger trg_feedback_update
after insert or update or delete on incident_feedbacks
for each row execute function update_incident_feedback_stats();

-- ==============================================================================
-- 9. HYBRID DEDUPLICATION RPC FUNCTION
-- ==============================================================================
create or replace function match_incident(
    target_lat double precision,
    target_lng double precision,
    query_embedding vector(512),
    match_radius_meters double precision default 50.0,
    similarity_threshold double precision default 0.85
)
returns table (
    incident_id uuid,
    category text,
    status text,
    priority_score integer,
    total_reports integer,
    duplicate_count integer,
    primary_image_url text,
    distance_meters double precision,
    visual_similarity double precision
)
language plpgsql
as $$
declare
    point_geo geography;
begin
    point_geo := ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography;

    return query
    select 
        i.id as incident_id,
        i.category,
        i.status,
        i.priority_score,
        i.total_reports,
        i.duplicate_count,
        i.primary_image_url,
        ST_Distance(i.location, point_geo) as distance_meters,
        (1 - (i.embedding <=> query_embedding)) as visual_similarity
    from incidents i
    where i.status not in ('CLOSED_VERIFIED', 'REJECTED')
      and i.embedding is not null
      and ST_DWithin(i.location, point_geo, match_radius_meters)
      and (1 - (i.embedding <=> query_embedding)) >= similarity_threshold
    order by visual_similarity desc, distance_meters asc
    limit 1;
end;
$$;
