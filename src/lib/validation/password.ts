/**
 * Password validation utilities for server-side validation
 */

export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}

export interface PasswordValidationOptions {
  minLength?: number
  requireUppercase?: boolean
  requireLowercase?: boolean
  requireNumbers?: boolean
  requireSpecialChars?: boolean
  maxLength?: number
}

const DEFAULT_OPTIONS: Required<PasswordValidationOptions> = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
  maxLength: 128,
}

// Common passwords to reject
const COMMON_PASSWORDS = [
  'password',
  '12345678',
  '123456789',
  'qwerty123',
  'admin123',
  'letmein1',
  'welcome1',
  'password1',
  'iloveyou',
  'sunshine',
  'princess',
  'football',
  'baseball',
  'trustno1',
  'superman',
  'iloveyou1',
  'master123',
  'hello123',
  'charlie1',
  'donald12',
]

export function validatePassword(
  password: string,
  options: PasswordValidationOptions = {}
): PasswordValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const errors: string[] = []

  // Length checks
  if (password.length < opts.minLength) {
    errors.push(`Password must be at least ${opts.minLength} characters`)
  }

  if (password.length > opts.maxLength) {
    errors.push(`Password must not exceed ${opts.maxLength} characters`)
  }

  // Character variety checks
  if (opts.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (opts.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (opts.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (opts.requireSpecialChars && !/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  // Check for common passwords
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('This password is too common. Please choose a stronger password')
  }

  // Check for repeated characters (e.g., "aaaaaaaa")
  if (/(.)\1{3,}/.test(password)) {
    errors.push('Password cannot contain more than 3 repeated characters in a row')
  }

  // Check for sequential characters
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
    errors.push('Password cannot contain sequential characters (e.g., "abc", "123")')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Simple validation for backwards compatibility - just checks minimum requirements
 */
export function validatePasswordSimple(password: string): PasswordValidationResult {
  return validatePassword(password, {
    minLength: 8,
    requireUppercase: false,
    requireLowercase: false,
    requireNumbers: false,
    requireSpecialChars: false,
  })
}

/**
 * Strict validation for admin/sensitive operations
 */
export function validatePasswordStrict(password: string): PasswordValidationResult {
  return validatePassword(password, {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  })
}
