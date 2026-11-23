import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind class names safely (shadcn/ui convention). */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const numberFmt = new Intl.NumberFormat('en-US')
const compactFmt = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

export const formatNumber = (n) => numberFmt.format(n ?? 0)
export const formatCompact = (n) => compactFmt.format(n ?? 0)

export function formatCurrency(n, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n ?? 0)
}

export function formatDate(value, opts = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', opts).format(new Date(value))
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const UNITS = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
]

/** "3 minutes ago", "yesterday", … */
export function timeAgo(value) {
  if (!value) return '—'
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000)
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size || unit === 'second') {
      return rtf.format(Math.round(seconds / size), unit)
    }
  }
  return '—'
}


export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
