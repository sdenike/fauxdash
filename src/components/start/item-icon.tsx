import { getIconByName } from '@/lib/icons'
import { cn } from '@/lib/utils'

/*
  Server-rendered icon for a bookmark, service or group. Rendering it here keeps the full Heroicons and
  MDI sets (lib/icons.tsx) out of the start page's browser bundle: the browser receives finished SVG.

  Stored icon formats:
    favicon:<path>             cached favicon; "_grayscale" paths have _black.png / _white.png variants
    selfhst:<id>               selfh.st icon set
    <Name>                     an entry in lib/icons.tsx
*/
export function ItemIcon({ icon, size, className }: { icon: string | null | undefined; size: number; className?: string }) {
  if (!icon) return null
  const box = { width: size, height: size }

  if (icon.startsWith('favicon:')) {
    let path = icon.slice('favicon:'.length)
    const serve = (p: string) => (p.startsWith('/api/favicons/serve/') ? p : `/api/favicons/serve/${p}`)
    if (path.includes('_grayscale')) {
      // Both variants are in the markup and CSS picks one, so the right one shows on first paint.
      return (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={serve(`${path}_black.png`)} alt="" loading="lazy" decoding="async" style={box} className={cn('object-contain dark:hidden', className)} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={serve(`${path}_white.png`)} alt="" loading="lazy" decoding="async" style={box} className={cn('hidden object-contain dark:block', className)} />
        </>
      )
    }
    path = serve(path)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={path} alt="" loading="lazy" decoding="async" style={box} className={cn('object-contain', className)} />
  }

  if (icon.startsWith('selfhst:')) {
    const id = icon.slice('selfhst:'.length)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://cdn.jsdelivr.net/gh/selfhst/icons@latest/png/${encodeURIComponent(id)}.png`}
        alt=""
        loading="lazy"
        decoding="async"
        style={box}
        className={cn('object-contain', className)}
      />
    )
  }

  const Named = getIconByName(icon)?.component
  if (!Named) return null
  return (
    <span aria-hidden="true" style={box} className={cn('inline-flex shrink-0', className)}>
      <Named className="h-full w-full" />
    </span>
  )
}
