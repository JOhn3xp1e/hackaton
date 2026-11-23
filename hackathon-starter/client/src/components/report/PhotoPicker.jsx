import { useEffect, useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { MAX_PHOTOS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { photosService } from '@/services/photosService'

/**
 * Pick up to MAX_PHOTOS images (camera on phones), with previews.
 * `files` is controlled by the parent; `onError(message)` reports rejected files.
 */
export function PhotoPicker({ files, onChange, onError, disabled }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [previews, setPreviews] = useState([])

  // Create object URLs inside the effect so StrictMode's mount/unmount/mount
  // cycle never leaves us rendering revoked URLs.
  useEffect(() => {
    const next = files.map((f) => ({ file: f, url: URL.createObjectURL(f) }))
    setPreviews(next)
    return () => next.forEach((p) => URL.revokeObjectURL(p.url))
  }, [files])

  const addFiles = (list) => {
    const incoming = Array.from(list ?? [])
    const accepted = []
    for (const file of incoming) {
      const problem = photosService.validate(file)
      if (problem) onError?.(problem)
      else accepted.push(file)
    }
    const room = MAX_PHOTOS - files.length
    if (accepted.length > room) onError?.(`You can attach up to ${MAX_PHOTOS} photos`)
    if (room > 0 && accepted.length) onChange([...files, ...accepted.slice(0, room)])
  }

  const remove = (index) => onChange(files.filter((_, i) => i !== index))

  return (
    <div className="grid gap-3">
      {files.length < MAX_PHOTOS && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            addFiles(e.dataTransfer.files)
          }}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center transition-colors',
            dragging ? 'border-primary bg-primary/5' : 'border-input bg-card hover:border-primary/50 hover:bg-accent/40',
            disabled && 'opacity-50',
          )}
        >
          <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
            <ImagePlus className="size-5" />
          </span>
          <span className="text-sm font-medium">Take or upload a photo</span>
          <span className="text-[12px] text-muted-foreground">
            JPG, PNG or WebP · up to 5 MB · {MAX_PHOTOS - files.length} remaining
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files)
          e.target.value = ''
        }}
      />
      {previews.length > 0 && (
        <ul className="grid grid-cols-3 gap-2">
          {previews.map((p, i) => (
            <li key={p.url} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
              <img src={p.url} alt={`Attachment ${i + 1}`} className="size-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={disabled}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-foreground/70 text-background backdrop-blur-sm transition-colors hover:bg-foreground"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
