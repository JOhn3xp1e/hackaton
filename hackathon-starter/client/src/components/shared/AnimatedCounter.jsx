import { useEffect, useRef } from 'react'
import { animate, useInView, useReducedMotion } from 'motion/react'
import { formatNumber } from '@/lib/utils'

/**
 * AnimatedCounter — counts up to `value` when scrolled into view.
 * Writes to the DOM directly (no re-render per frame).
 *   <AnimatedCounter value={12840} format={formatCurrency} />
 */
export function AnimatedCounter({ value = 0, format = formatNumber, duration = 1.1, className }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduce = useReducedMotion()
  const prev = useRef(0)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (reduce || !inView) {
      if (reduce) node.textContent = format(value)
      return
    }
    const controls = animate(prev.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent = format(Number.isInteger(value) ? Math.round(v) : Math.round(v * 10) / 10)
      },
    })
    prev.current = value
    return () => controls.stop()
  }, [value, inView, reduce, format, duration])

  return (
    <span ref={ref} className={className}>
      {format(reduce ? value : 0)}
    </span>
  )
}
