'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FlaskConical, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

/** Empty start page, admin only: fill it with sample links that can be removed later from Admin, Tools. */
export function LoadDemoButton() {
  const router = useRouter()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/demo/load', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `The server answered ${res.status}.`)
      }
      router.refresh()
    } catch (err) {
      toast({
        title: 'Could not load the sample content',
        description: err instanceof Error ? err.message : 'Check the server log and try again.',
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button variant="outline" onClick={load} disabled={busy}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FlaskConical className="h-4 w-4" aria-hidden="true" />}
      Load sample content
    </Button>
  )
}
