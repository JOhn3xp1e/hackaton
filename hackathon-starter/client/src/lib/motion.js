/**
 * Motion presets — one place to tune the feel of the whole app.
 * Keep animations short and subtle: they should guide, not decorate.
 */

export const ease = {
  out: [0.16, 1, 0.3, 1], // expo-out: calm, editorial
  inOut: [0.65, 0, 0.35, 1],
}

export const duration = { fast: 0.15, base: 0.25, slow: 0.45 }

export const spring = {
  snappy: { type: 'spring', stiffness: 500, damping: 32, mass: 0.6 },
  soft: { type: 'spring', stiffness: 260, damping: 30 },
}

/** Page enter / exit */
export const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: ease.out } },
  exit: { opacity: 0, y: -4, transition: { duration: duration.fast, ease: ease.inOut } },
}

/** Parent that staggers its children */
export const staggerContainer = (stagger = 0.05, delay = 0) => ({
  initial: {},
  animate: { transition: { staggerChildren: stagger, delayChildren: delay } },
})

/** Child item used inside a stagger container */
export const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: ease.out } },
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: duration.base, ease: ease.out } },
  exit: { opacity: 0, transition: { duration: duration.fast } },
}

/** Modal panel */
export const modalVariants = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: duration.base, ease: ease.out } },
  exit: { opacity: 0, y: 6, scale: 0.98, transition: { duration: duration.fast, ease: ease.inOut } },
}

/** Interactive micro-interactions */
export const tapScale = { whileTap: { scale: 0.97 } }
export const hoverLift = { whileHover: { y: -2 }, transition: spring.soft }
