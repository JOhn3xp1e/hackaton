import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { cn } from '@/lib/utils'

/** URL a room's QR code points to (the report form with the room pre-filled). */
export const reportUrlFor = (code) => `${window.location.origin}/r/${encodeURIComponent(code)}`

/** Render a QR code as a PNG data URL (generated locally, no network). */
export async function qrDataUrl(text, size = 512) {
  return QRCode.toDataURL(text, { width: size, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#111511', light: '#ffffff' } })
}

export function QrImage({ code, size = 160, className }) {
  const [src, setSrc] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    setError(null)
    qrDataUrl(reportUrlFor(code), size * 2)
      .then((url) => active && setSrc(url))
      .catch((err) => active && setError(err.message))
    return () => {
      active = false
    }
  }, [code, size])

  if (error) return <p className="text-[12px] text-destructive">QR failed: {error}</p>
  return (
    <div className={cn('grid place-items-center rounded-md bg-white p-2', className)} style={{ width: size + 16, height: size + 16 }}>
      {src ? (
        <img src={src} width={size} height={size} alt={`QR code for ${code}`} />
      ) : (
        <div className="animate-pulse rounded bg-neutral-200" style={{ width: size, height: size }} />
      )}
    </div>
  )
}
