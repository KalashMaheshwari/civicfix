import type { Incident, Profile, TriageResult } from '../types/incident';

const API_BASE = '/api/v1/complaints';

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
  return clean;
}

export async function fetchIncidents(status?: string, category?: string): Promise<Incident[]> {
  const params = new URLSearchParams();
  if (status && status !== 'ALL') params.append('status', status);
  if (category) params.append('category', category);
  params.append('limit', '100');

  const res = await fetch(`${API_BASE}/incidents?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load incidents');
  return res.json();
}

export async function submitComplaintReport(formData: FormData): Promise<TriageResult> {
  const res = await fetch(`${API_BASE}/report`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to submit report');
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
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to submit resolution proof');
  return data;
}

export async function submitCitizenVote(
  incidentId: string,
  citizenId: string,
  isFixed: boolean,
  comment?: string
): Promise<{ message: string; feedback: any; incident: Incident }> {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/vote-feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      citizen_id: citizenId,
      is_fixed: isFixed,
      comment: comment || (isFixed ? 'Verified fixed by citizen' : 'Disputed: Issue still broken'),
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to submit vote');
  return data;
}

// Authentication API
export async function loginUser(email: string, password: string): Promise<{ access_token: string; user: Profile }> {
  const res = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Login failed');
  return data;
}

export async function registerCitizen(payload: {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<{ access_token: string; user: Profile }> {
  const res = await fetch('/api/v1/auth/register-citizen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Registration failed');
  return data;
}

export async function registerOfficial(payload: {
  full_name: string;
  email: string;
  password: string;
  department: string;
  official_badge_id: string;
  phone?: string;
}): Promise<{ access_token: string; user: Profile }> {
  const res = await fetch('/api/v1/auth/register-official', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Official registration failed');
  return data;
}
