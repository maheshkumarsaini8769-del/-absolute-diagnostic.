/**
 * Password Policy Enforcement as required by opencode/new1.md:
 * - Minimum 10 characters
 * - Uppercase letter
 * - Lowercase letter
 * - Number
 * - Special character
 */

export interface PasswordValidationResult {
  valid: boolean
  score: number // 0 to 4
  strengthLabel: 'Very Weak' | 'Weak' | 'Medium' | 'Strong' | 'Very Strong'
  errors: string[]
}

export function validatePasswordPolicy(password: string): PasswordValidationResult {
  const errors: string[] = []

  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      score: 0,
      strengthLabel: 'Very Weak',
      errors: ['Password is required.'],
    }
  }

  if (password.length < 10) {
    errors.push('Password must be at least 10 characters long.')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z).')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z).')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number (0-9).')
  }
  if (!/[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\~`']/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&* etc.).')
  }

  // Calculate strength score
  let score = 0
  if (password.length >= 10) score++
  if (password.length >= 14) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\~`']/.test(password)) score++

  let strengthLabel: PasswordValidationResult['strengthLabel'] = 'Very Weak'
  if (score === 2) strengthLabel = 'Weak'
  else if (score === 3) strengthLabel = 'Medium'
  else if (score === 4) strengthLabel = 'Strong'
  else if (score >= 5) strengthLabel = 'Very Strong'

  return {
    valid: errors.length === 0,
    score: Math.min(score, 4),
    strengthLabel,
    errors,
  }
}
