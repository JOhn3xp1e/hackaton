import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { config } from '@/lib/config'
import { cn } from '@/lib/utils'

/**
 * QR targets. They use VITE_PUBLIC_APP_URL (the Vercel deployment) so stickers
 * printed from a local dev server still open the live site.
 */
/** Room QR: the report form with the room pre-filled. */
export const reportUrlFor = (code) => `${config.publicAppUrl}/r/${encodeURIComponent(code)}`
/** Equipment QR: the report form with the room and the item pre-filled. */
export const equipmentUrlFor = (shortCode) => `${config.publicAppUrl}/e/${encodeURIComponent(shortCode)}`

/** Render a QR code as a PNG data URL (generated locally, no network). */
export async function qrDataUrl(text, size = 512) {
  return QRCode.toDataURL(text, { width: size, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#111511', light: '#ffffff' } })
}

/** Trigger a PNG download of the QR code for `url`. Throws on failure. */
export async function downloadQr(url, filename) {
  const a = document.createElement('a')
  a.href = await qrDataUrl(url, 1024)
  a.download = filename
  a.click()
}

/**
 * @param {{ url?: string, code?: string, label?: string, size?: number, className?: string }} props
 * Pass `url` for any QR target, or `code` as a shortcut for a room's report URL.
 */
export function QrImage({ url, code, label, size = 160, className }) {
  const target = url ?? reportUrlFor(code)
  const [src, setSrc] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    setError(null)
    qrDataUrl(target, size * 2)
      .then((data) => active && setSrc(data))
      .catch((err) => active && setError(err.message))
    return () => {
      active = false
    }
  }, [target, size])

  if (error) return <p className="text-[12px] text-destructive">QR failed: {error}</p>
  return (
    <div className={cn('grid place-items-center rounded-md bg-white p-2', className)} style={{ width: size + 16, height: size + 16 }}>
      {src ? (
        <img src={src} width={size} height={size} alt={`QR code for ${label ?? code ?? target}`} />
      ) : (
        <div className="animate-pulse rounded bg-neutral-200" style={{ width: size, height: size }} />
      )}
    </div>
  )
}
