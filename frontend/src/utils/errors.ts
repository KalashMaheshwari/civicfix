/**
 * Production error humanizer utility for CivicFix.
 * Translates backend, API, network, and Pydantic validation errors
 * into natural, polite, user-friendly human sentences.
 */

const FIELD_LABELS: Record<string, string> = {
  full_name: 'Full Name',
  email: 'Email Address',
  password: 'Password',
  phone: 'Phone Number',
  department: 'Department',
  official_badge_id: 'Official Badge ID',
  latitude: 'Latitude',
  longitude: 'Longitude',
  address: 'Address',
  description: 'Description',
  file: 'Photo Evidence',
  is_fixed: 'Resolution Status',
  comment: 'Dispute / Verification Note',
  citizen_id: 'Citizen ID',
  incident_id: 'Incident ID',
};

function humanizeField(field: string): string {
  if (FIELD_LABELS[field]) return FIELD_LABELS[field];
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Converts robotic validation messages (e.g. "String should have at least 6 characters")
 * into fluent, natural English sentences (e.g. "Password must be at least 6 characters long.").
 */
function humanizeValidationRule(field: string, msg: string, ctx?: Record<string, any>): string {
  const fLower = field.toLowerCase();
  const mLower = msg.toLowerCase();

  // 1. Specific field overrides
  if (fLower === 'password') {
    if (mLower.includes('at least') || mLower.includes('too_short') || mLower.includes('min_length')) {
      const minL = ctx?.min_length || 6;
      return `Password must be at least ${minL} characters long.`;
    }
    if (mLower.includes('required') || mLower.includes('missing')) {
      return 'Please enter your password.';
    }
    return 'Please enter a valid password (at least 6 characters).';
  }

  if (fLower === 'email') {
    if (mLower.includes('required') || mLower.includes('missing')) {
      return 'Please enter your email address.';
    }
    return 'Please enter a valid email address.';
  }

  if (fLower === 'full_name' || fLower === 'fullname') {
    if (mLower.includes('at least') || mLower.includes('too_short')) {
      return 'Full name must be at least 2 characters.';
    }
    if (mLower.includes('required') || mLower.includes('missing')) {
      return 'Please enter your full name.';
    }
    return 'Please enter your full name.';
  }

  if (fLower === 'official_badge_id') {
    return 'Please enter your official badge or employee ID.';
  }

  if (fLower === 'department') {
    return 'Please select your municipal department.';
  }

  if (fLower === 'file' || fLower === 'image') {
    return 'Please upload a photo of the issue (JPEG, PNG, or WEBP).';
  }

  if (fLower === 'latitude' || fLower === 'longitude') {
    return 'Please provide valid GPS location coordinates.';
  }

  if (fLower === 'address') {
    return 'Please provide a street address or landmark.';
  }

  const label = humanizeField(field);

  // 2. Generic string length & requirement patterns
  if (mLower.includes('string should have at least') || mLower.includes('at least') || mLower.includes('too short')) {
    const match = msg.match(/\d+/);
    const minL = match ? match[0] : (ctx?.min_length || '2');
    return `${label} must be at least ${minL} characters long.`;
  }

  if (mLower.includes('string should have at most') || mLower.includes('at most') || mLower.includes('too long')) {
    const match = msg.match(/\d+/);
    const maxL = match ? match[0] : (ctx?.max_length || '100');
    return `${label} cannot exceed ${maxL} characters.`;
  }

  if (mLower.includes('field required') || mLower.includes('missing') || mLower === 'required') {
    return `Please enter your ${label.toLowerCase()}.`;
  }

  if (mLower.includes('value is not a valid') || mLower.includes('input should be a valid')) {
    return `Please enter a valid ${label.toLowerCase()}.`;
  }

  // Fallback cleanup
  let clean = msg
    .replace(/^String should have at least\s*/i, `${label} must be at least `)
    .replace(/^String should have at most\s*/i, `${label} cannot exceed `)
    .replace(/^Value error,\s*/i, '')
    .replace(/^value is not a valid /i, 'Invalid ')
    .trim();

  if (!clean.endsWith('.')) clean += '.';
  return clean;
}

function cleanRawString(text: string): string {
  if (!text) return '';
  let msg = text.trim();

  // If string contains JSON format, extract it
  if ((msg.startsWith('{') && msg.endsWith('}')) || (msg.startsWith('[') && msg.endsWith(']'))) {
    try {
      const parsed = JSON.parse(msg);
      return formatErrorMessage(parsed);
    } catch {
      // Continue with text processing
    }
  }

  // Strip robotic prefix strings
  msg = msg
    .replace(/^(Error:\s*|Exception:\s*|HTTPException:\s*|ValueError:\s*|AssertionError:\s*)/i, '')
    .replace(/^Value error,\s*/i, '')
    .trim();

  // Translate specific robotic patterns in strings like "Password: String should have at least 6 characters."
  const colonMatch = msg.match(/^([a-zA-Z0-9_ ]+):\s*(.*)$/);
  if (colonMatch) {
    const field = colonMatch[1].trim();
    const rest = colonMatch[2].trim();
    return humanizeValidationRule(field, rest);
  }

  if (msg.toLowerCase().includes('string should have at least')) {
    msg = msg.replace(/String should have at least\s*/i, 'Must be at least ');
  }

  return msg;
}

export function formatErrorMessage(
  err: unknown,
  fallback = 'An unexpected error occurred. Please try again.'
): string {
  if (err === null || err === undefined || err === '') {
    return fallback;
  }

  // 1. Error instance
  if (err instanceof Error) {
    const msg = err.message || '';
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed')) {
      return 'Unable to connect to the server. Please check your internet connection or try again.';
    }
    return formatErrorMessage(msg, fallback);
  }

  // 2. String
  if (typeof err === 'string') {
    const cleaned = cleanRawString(err);
    if (!cleaned) return fallback;

    if (cleaned.includes('Failed to fetch') || cleaned.includes('NetworkError')) {
      return 'Unable to connect to the server. Please check your internet connection or try again.';
    }

    return cleaned;
  }

  // 3. Array of validation errors (Pydantic / FastAPI detail array)
  if (Array.isArray(err)) {
    if (err.length === 0) return fallback;

    const messages = err.map((item) => {
      if (typeof item === 'string') return cleanRawString(item);
      if (typeof item === 'object' && item !== null) {
        const rawLoc = Array.isArray(item.loc) ? item.loc : [];
        const filteredLoc = rawLoc.filter((p: any) => p !== 'body' && p !== 'query' && p !== 'path' && p !== 'header' && p !== 'formData');
        const field = filteredLoc.length > 0 ? String(filteredLoc[filteredLoc.length - 1]) : '';
        const rawMsg = item.msg || item.message || '';
        return humanizeValidationRule(field || 'input', rawMsg, item.ctx);
      }
      return String(item);
    }).filter(Boolean);

    return messages.length > 0 ? messages.join(' ') : fallback;
  }

  // 4. Object error formats
  if (typeof err === 'object' && err !== null) {
    const obj = err as Record<string, any>;
    if (obj.detail) return formatErrorMessage(obj.detail, fallback);
    if (obj.message) return formatErrorMessage(obj.message, fallback);
    if (obj.error) return formatErrorMessage(obj.error, fallback);
    if (obj.errors) return formatErrorMessage(obj.errors, fallback);
    if (obj.msg) return formatErrorMessage(obj.msg, fallback);
  }

  return String(err) || fallback;
}
