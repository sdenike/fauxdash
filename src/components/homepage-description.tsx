'use client'

interface HomepageDescriptionProps {
  description: string
  enabled: boolean
}

export function HomepageDescription({ description, enabled }: HomepageDescriptionProps) {
  if (!enabled || !description) {
    return null
  }

  return (
    <div className="mb-6">
      <p className="text-lg text-muted-foreground whitespace-pre-wrap">
        {description}
      </p>
    </div>
  )
}
