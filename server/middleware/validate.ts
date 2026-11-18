export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

export function validatePasswordStrength(password: string): string | null {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must include both letters and numbers';
  }
  return null;
}

export function sanitizeString(val: unknown, maxLen = 500): string {
  return String(val ?? '').trim().slice(0, maxLen);
}

export function containsLeakedKeyword(text: string): boolean {
  const lower = String(text || '').toLowerCase();
  const forbidden = ['leaked', 'leak', 'unreleased', 'confidential exam', 'upcoming paper', 'stolen paper'];
  return forbidden.some((term) => lower.includes(term));
}
