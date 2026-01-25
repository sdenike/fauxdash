interface User {
  username?: string | null
  email: string
  firstname?: string | null
  lastname?: string | null
}

/**
 * Substitutes template variables in a string with user data.
 * Supported variables:
 * - {{username}}: User's username (falls back to email if not set)
 * - {{email}}: User's email address
 * - {{firstname}}: User's first name
 * - {{lastname}}: User's last name
 */
export function substituteVariables(template: string, user: User): string {
  if (!template || !user) return template

  let result = template
    .replace(/\{\{username\}\}/g, user.username || user.email || '')
    .replace(/\{\{email\}\}/g, user.email || '')
    .replace(/\{\{firstname\}\}/g, user.firstname || '')
    .replace(/\{\{lastname\}\}/g, user.lastname || '')

  // Clean up any leftover punctuation/spacing from empty variables
  // e.g., "Hello, " -> "Hello" or "Hello  world" -> "Hello world"
  result = result
    .replace(/,\s*$/g, '')      // Remove trailing comma and spaces
    .replace(/\s{2,}/g, ' ')    // Collapse multiple spaces
    .trim()

  return result
}
