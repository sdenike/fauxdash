'use client'

import { useState } from 'react'
import { UpdateChecker } from '@/components/admin/update-checker'
import { ChangelogDialog } from '@/components/changelog-dialog'

/** Version badge with update check; opens the changelog. */
export function DashboardVersion() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <UpdateChecker onChangelogClick={() => setOpen(true)} />
      <ChangelogDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
