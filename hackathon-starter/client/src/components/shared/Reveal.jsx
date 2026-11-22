import { motion, useReducedMotion } from 'motion/react'
import { ease, fadeUp, staggerContainer } from '@/lib/motion'

/**
 * Stagger — children wrapped in <StaggerItem> animate in one after another.
 *   <Stagger className="grid gap-4"><StaggerItem>…</StaggerItem>…</Stagger>
 */
export function Stagger({ as = 'div', stagger = 0.06, delay = 0, className, children, ...props }) {
  const Comp = motion[as] ?? motion.div
  return (
    <Comp variants={staggerContainer(stagger, delay)} initial="initial" animate="animate" className={className} {...props}>
      {children}
    </Comp>
  )
}

export function StaggerItem({ as = 'div', className, children, ...props }) {
  const Comp = motion[as] ?? motion.div
  return (
    <Comp variants={fadeUp} className={className} {...props}>
      {children}
    </Comp>
  )
}

/**
 * TextReveal — subtle word-by-word reveal for headings.
 *   <TextReveal as="h1" className="text-3xl" text="Good morning" />
 */
export function TextReveal({ text = '', as = 'span', className, delay = 0, ...props }) {
  const reduce = useReducedMotion()
  const Comp = motion[as] ?? motion.span
  const words = String(text).split(' ')

  if (reduce) {
    const Static = as
    return <Static className={className}>{text}</Static>
  }

  return (
    <Comp
      className={className}
      initial="initial"
      animate="animate"
      variants={staggerContainer(0.04, delay)}
      aria-label={text}
      {...props}
    >
      {words.map((word, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.08em] -mb-[0.08em] align-bottom">
          <motion.span
            className="inline-block"
            variants={{
              initial: { y: '105%', opacity: 0 },
              animate: { y: '0%', opacity: 1, transition: { duration: 0.55, ease: ease.out } },
            }}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </Comp>
  )
}
