import { AnimatePresence, motion } from 'motion/react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/providers/ThemeProvider'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  return (
    <Tooltip content={dark ? 'Light mode' : 'Dark mode'}>
      <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={dark ? 'moon' : 'sun'}
            initial={{ y: -14, opacity: 0, rotate: -30 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 14, opacity: 0, rotate: 30 }}
            transition={{ duration: 0.18 }}
            className="grid place-items-center"
          >
            {dark ? <Moon /> : <Sun />}
          </motion.span>
        </AnimatePresence>
      </Button>
    </Tooltip>
  )
}
