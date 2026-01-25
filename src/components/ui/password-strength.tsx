'use client'

import { useMemo } from 'react'
import { CheckCircle2, AlertCircle, ShieldAlert, ShieldCheck, Shield } from 'lucide-react'

interface PasswordStrengthProps {
  password: string
}

interface StrengthResult {
  score: number // 0-4
  label: string
  color: string
  bgColor: string
  icon: React.ReactNode
}

function calculateStrength(password: string): StrengthResult {
  if (!password) {
    return { score: 0, label: '', color: '', bgColor: 'bg-muted', icon: null }
  }

  let score = 0

  // Length checks
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (password.length >= 16) score++

  // Character variety checks
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  // Penalize common patterns
  if (/^[a-zA-Z]+$/.test(password)) score-- // Only letters
  if (/^[0-9]+$/.test(password)) score-- // Only numbers
  if (/(.)\1{2,}/.test(password)) score-- // Repeated characters
  if (/^(password|123456|qwerty|admin|letmein)/i.test(password)) score -= 2 // Common passwords

  // Normalize to 0-4 scale
  const normalizedScore = Math.max(0, Math.min(4, Math.floor(score / 2)))

  const strengthLevels: StrengthResult[] = [
    { score: 0, label: 'Very Weak', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-500', icon: <ShieldAlert className="h-3.5 w-3.5" /> },
    { score: 1, label: 'Weak', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-500', icon: <AlertCircle className="h-3.5 w-3.5" /> },
    { score: 2, label: 'Fair', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-500', icon: <Shield className="h-3.5 w-3.5" /> },
    { score: 3, label: 'Good', color: 'text-lime-600 dark:text-lime-400', bgColor: 'bg-lime-500', icon: <ShieldCheck className="h-3.5 w-3.5" /> },
    { score: 4, label: 'Strong', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-500', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  ]

  return strengthLevels[normalizedScore]
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = useMemo(() => calculateStrength(password), [password])

  if (!password) {
    return null
  }

  return (
    <div className="mt-2 space-y-1.5 animate-in fade-in duration-200">
      {/* Strength bars */}
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ease-out ${
              level <= strength.score
                ? `${strength.bgColor} scale-y-100`
                : 'bg-muted scale-y-75'
            }`}
            style={{
              transitionDelay: `${level * 50}ms`,
            }}
          />
        ))}
      </div>

      {/* Label with icon */}
      <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors duration-200 ${strength.color}`}>
        {strength.icon}
        <span>{strength.label}</span>
      </div>
    </div>
  )
}
