import { useState } from 'react'
import { Modal } from '@/components/ui/modal'

/** Thumbnails that open a larger preview in a modal. */
export function PhotoGallery({ urls = [] }) {
  const [active, setActive] = useState(null)
  if (!urls.length) return null

  return (
    <>
      <ul className="grid grid-cols-3 gap-2 sm:max-w-md">
        {urls.map((url, i) => (
          <li key={url}>
            <button
              type="button"
              onClick={() => setActive(url)}
              className="block aspect-square w-full overflow-hidden rounded-lg border border-border bg-muted transition-opacity hover:opacity-85"
              aria-label={`Open photo ${i + 1}`}
            >
              <img src={url} alt={`Reported issue, photo ${i + 1}`} loading="lazy" className="size-full object-cover" />
            </button>
          </li>
        ))}
      </ul>
      <Modal open={Boolean(active)} onOpenChange={(o) => !o && setActive(null)} title="Photo" size="lg">
        {active && <img src={active} alt="Reported issue" className="max-h-[70vh] w-full rounded-md object-contain" />}
      </Modal>
    </>
  )
}
