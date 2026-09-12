/**
 * Password strength and security policy validation utilities.
 */

export interface PasswordRuleChecks {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 to 5
  strengthLabel: 'Weak' | 'Fair' | 'Good' | 'Strong';
  strengthColor: string;
  errorMessage?: string;
  checks: PasswordRuleChecks;
}

export function validatePassword(password: string): PasswordValidationResult {
  const p = password || '';

  const checks: PasswordRuleChecks = {
    minLength: p.length >= 8,
    hasUppercase: /[A-Z]/.test(p),
    hasLowercase: /[a-z]/.test(p),
    hasNumber: /\d/.test(p),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>\-_=+/\\~`]/.test(p),
  };

  const passedCount = Object.values(checks).filter(Boolean).length;
  const isValid = passedCount === 5 && p.length <= 128;

  let strengthLabel: 'Weak' | 'Fair' | 'Good' | 'Strong' = 'Weak';
  let strengthColor = '#ef4444'; // Red

  if (passedCount >= 5) {
    strengthLabel = 'Strong';
    strengthColor = '#10b981'; // Green
  } else if (passedCount >= 4) {
    strengthLabel = 'Good';
    strengthColor = '#0284c7'; // Blue
  } else if (passedCount >= 2) {
    strengthLabel = 'Fair';
    strengthColor = '#f59e0b'; // Amber
  }

  let errorMessage: string | undefined;
  if (!checks.minLength) {
    errorMessage = 'Password must be at least 8 characters long.';
  } else if (!checks.hasUppercase) {
    errorMessage = 'Password must contain at least one uppercase letter (A-Z).';
  } else if (!checks.hasLowercase) {
    errorMessage = 'Password must contain at least one lowercase letter (a-z).';
  } else if (!checks.hasNumber) {
    errorMessage = 'Password must contain at least one number (0-9).';
  } else if (!checks.hasSpecial) {
    errorMessage = 'Password must contain at least one special character (e.g. !@#$%^&*).';
  } else if (p.length > 128) {
    errorMessage = 'Password cannot exceed 128 characters.';
  }

  return {
    isValid,
    score: passedCount,
    strengthLabel,
    strengthColor,
    errorMessage,
    checks,
  };
}
