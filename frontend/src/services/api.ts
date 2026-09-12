import type { Incident, Profile, TriageResult } from '../types/incident';
import { formatErrorMessage } from '../utils/errors';

const RAW_API_URL = import.meta.env.VITE_API_URL || '';
export const BASE_URL = RAW_API_URL.replace(/\/+$/, '');
const API_BASE = `${BASE_URL}/api/v1/complaints`;
const AUTH_BASE = `${BASE_URL}/api/v1/auth`;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('civicfix_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function formatImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  // Replace Windows backslashes with forward slashes
  let clean = url.replace(/\\/g, '/');
  if (!clean.startsWith('/')) {
    clean = '/' + clean;
  }

  // If path is a public frontend asset (e.g. /demo issues/..., /bento/..., /citizen.webp), serve directly from frontend
  if (clean.startsWith('/demo issues/') || clean.startsWith('/demo%20issues/') || clean.startsWith('/bento/') || clean.startsWith('/nav/')) {
    return clean;
  }

  return BASE_URL ? `${BASE_URL}${clean}` : clean;
}

// In-memory query cache for instant page switching & low device network overhead
const cache = new Map<string, { data: Incident[]; timestamp: number }>();
const CACHE_TTL_MS = 15000; // 15 seconds fresh cache

export function invalidateIncidentsCache() {
  cache.clear();
}

export async function fetchIncidents(status?: string, category?: string, forceRefresh = false, citizenId?: string): Promise<Incident[]> {
  const params = new URLSearchParams();
  if (status && status !== 'ALL') params.append('status', status);
  if (category) params.append('category', category);
  if (citizenId) params.append('citizen_id', citizenId);
  params.append('limit', '100');

  const cacheKey = params.toString();
  const cached = cache.get(cacheKey);

  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const res = await fetch(`${API_BASE}/incidents?${params.toString()}`);
  const data = await handleApiResponse<Incident[]>(res, 'Failed to load incidents');
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

async function handleApiResponse<T>(res: Response, fallbackError: string): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  let data: any;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      throw new Error(formatErrorMessage(text, fallbackError));
    }
    return text as unknown as T;
  }

  if (!res.ok) {
    const errorData = data?.detail ?? data?.message ?? data?.error ?? data;
    const cleanError = formatErrorMessage(errorData, fallbackError);
    throw new Error(cleanError);
  }

  return data as T;
}

export async function submitComplaintReport(formData: FormData): Promise<TriageResult> {
  const res = await fetch(`${API_BASE}/report`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  const data = await handleApiResponse<TriageResult>(res, 'Failed to submit report');
  invalidateIncidentsCache();
  return data;
}

export async function submitResolutionProof(
  incidentId: string,
  formData: FormData
): Promise<{ message: string; incident: Incident }> {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/resolve`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  const data = await handleApiResponse<{ message: string; incident: Incident }>(
    res,
    'Failed to submit resolution proof'
  );
  invalidateIncidentsCache();
  return data;
}

export async function submitCitizenVote(
  incidentId: string,
  citizenId: string,
  isFixed: boolean,
  comment?: string,
  file?: File
): Promise<{ message: string; feedback: any; incident: Incident }> {
  const formData = new FormData();
  formData.append('citizen_id', citizenId);
  formData.append('is_fixed', isFixed.toString());
  formData.append('comment', comment || (isFixed ? 'Verified fixed by citizen' : 'Disputed: Issue still broken'));

  if (file) {
    formData.append('file', file);
  }

  const res = await fetch(`${API_BASE}/incidents/${incidentId}/vote-feedback`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  const data = await handleApiResponse<{ message: string; feedback: any; incident: Incident }>(
    res,
    'Failed to submit vote'
  );
  invalidateIncidentsCache();
  return data;
}

// Authentication API
export async function loginUser(email: string, password: string): Promise<{ access_token: string; user: Profile }> {
  const res = await fetch(`${AUTH_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleApiResponse<{ access_token: string; user: Profile }>(res, 'Login failed');
}

export async function registerCitizen(payload: {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<{ access_token: string; user: Profile }> {
  const res = await fetch(`${AUTH_BASE}/register-citizen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleApiResponse<{ access_token: string; user: Profile }>(res, 'Registration failed');
}

export async function registerOfficial(payload: {
  full_name: string;
  email: string;
  password: string;
  department: string;
  official_badge_id: string;
  phone?: string;
}): Promise<{ access_token: string; user: Profile }> {
  const res = await fetch(`${AUTH_BASE}/register-official`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleApiResponse<{ access_token: string; user: Profile }>(res, 'Official registration failed');
}
