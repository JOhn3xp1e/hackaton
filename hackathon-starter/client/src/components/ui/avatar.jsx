import { useState } from 'react'
import { cn, initials } from '@/lib/utils'

const SIZES = { sm: 'size-7 text-[11px]', md: 'size-9 text-xs', lg: 'size-12 text-sm' }

/** Avatar with image + initials fallback. */
export function Avatar({ src, name = '', size = 'md', className }) {
  const [failed, setFailed] = useState(false)
  return (
    <span
      className={cn(
        'relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-secondary font-medium text-secondary-foreground',
        SIZES[size],
        className,
      )}
      title={name}
    >
      {src && !failed ? (
        <img src={src} alt={name} className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        initials(name) || '?'
      )}
    </span>
  )
}
