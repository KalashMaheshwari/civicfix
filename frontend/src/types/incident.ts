export type IncidentStatus = 
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED_PENDING_VERIFICATION'
  | 'CLOSED_VERIFIED'
  | 'DISPUTED_REOPENED'
  | 'REJECTED';

export type UserRole = 'citizen' | 'official' | 'admin';

export interface Incident {
  id: string;
  category: string;
  title: string | null;
  description: string | null;
  status: IncidentStatus;
  priority_score: number;
  base_severity: number;
  duplicate_count: number;
  total_reports: number;
  primary_image_url: string;
  latitude: number;
  longitude: number;
  address: string | null;
  assigned_department: string | null;
  assigned_officer_name: string | null;
  resolution_image_url: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  citizen_feedback_yes: number;
  citizen_feedback_no: number;
  citizen_verified_status: 'PENDING' | 'CONFIRMED' | 'DISPUTED';
  citizen_ids?: string[];
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  department: string | null;
  official_badge_id: string | null;
  civic_points: number;
  created_at: string;
}

export interface TriageResult {
  is_civic_issue: boolean;
  detected_category: string;
  confidence: number;
  margin: number;
  is_duplicate: boolean;
  incident_id: string | null;
  priority_score: number;
  message: string;
  incident?: Incident | null;
}
