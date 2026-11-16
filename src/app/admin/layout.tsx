import { redirect } from 'next/navigation'
import { getSession } from '@/lib/server/start-page'
import { AdminShell } from '@/components/admin/admin-shell'

export const dynamic = 'force-dynamic'

// Checked on the server: a non-admin never sees an empty "Loading..." admin shell or a flash of it.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session?.user) redirect('/login')
  if (!(session.user as any).isAdmin) redirect('/')
  return <AdminShell>{children}</AdminShell>
}
