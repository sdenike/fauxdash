'use client'

import { useMemo, useCallback, useId } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, XCircle } from 'lucide-react'

interface PasswordConfirmInputProps {
  password: string
  confirmPassword: string
  onConfirmPasswordChange: (value: string) => void
  label?: string
  placeholder?: string
  disabled?: boolean
}

export function PasswordConfirmInput({
  password,
  confirmPassword,
  onConfirmPasswordChange,
  label = 'Confirm Password',
  placeholder = 'Confirm password',
  disabled = false,
}: PasswordConfirmInputProps) {
  const id = useId()
  const statusId = `${id}-status`

  const passwordsMatch = useMemo(() => {
    if (!confirmPassword) return null
    return password === confirmPassword
  }, [password, confirmPassword])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onConfirmPasswordChange(e.target.value)
    },
    [onConfirmPasswordChange]
  )

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="password"
          value={confirmPassword}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          aria-describedby={confirmPassword ? statusId : undefined}
          aria-invalid={passwordsMatch === false ? 'true' : undefined}
          className={
            confirmPassword
              ? passwordsMatch
                ? 'pr-10 border-success focus-visible:ring-success'
                : 'pr-10 border-destructive focus-visible:ring-destructive'
              : ''
          }
        />
        {confirmPassword && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {passwordsMatch ? (
              <CheckCircle2
                className="h-4 w-4 text-success animate-in zoom-in duration-200"
                aria-hidden="true"
              />
            ) : (
              <XCircle
                className="h-4 w-4 text-destructive animate-in zoom-in duration-200"
                aria-hidden="true"
              />
            )}
          </div>
        )}
      </div>
      {confirmPassword && (
        <p
          id={statusId}
          role="status"
          aria-live="polite"
          className={`text-xs animate-in fade-in slide-in-from-top-1 duration-200 ${
            passwordsMatch ? 'text-success' : 'text-destructive'
          }`}
        >
          {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
        </p>
      )}
    </div>
  )
}

// Export the match calculation for use in form validation
export function usePasswordMatch(password: string, confirmPassword: string) {
  return useMemo(() => {
    if (!confirmPassword) return null
    return password === confirmPassword
  }, [password, confirmPassword])
}
