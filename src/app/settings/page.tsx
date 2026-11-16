import { redirect } from 'next/navigation'

// Settings live in one place now: Admin, Settings.
export default function SettingsRedirect() {
  redirect('/admin/settings')
}
