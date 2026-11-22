import { Dialog as DialogPrimitive } from 'radix-ui'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { modalVariants } from '@/lib/motion'

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

/**
 * Modal — accessible dialog (Radix) with Motion enter/exit animations.
 *
 *   const modal = useDisclosure()
 *   <Modal open={modal.isOpen} onOpenChange={modal.setIsOpen}
 *          title="New item" description="…" footer={<Button>Save</Button>}>
 *     …content…
 *   </Modal>
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  footer,
  size = 'md',
  hideClose = false,
  headless = false,
  className,
  children,
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-[2px] dark:bg-black/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </DialogPrimitive.Overlay>
            <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4 pointer-events-none">
              <DialogPrimitive.Content asChild forceMount>
                <motion.div
                  variants={modalVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className={cn(
                    'pointer-events-auto relative w-full rounded-xl border border-border bg-popover text-popover-foreground shadow-lg',
                    'focus:outline-none',
                    SIZES[size],
                    className,
                  )}
                >
                  {(title || description) && (
                    <div className="grid gap-1 border-b border-border px-6 pt-5 pb-4 pr-12">
                      {title && (
                        <DialogPrimitive.Title className="font-display text-lg font-semibold tracking-tight">
                          {title}
                        </DialogPrimitive.Title>
                      )}
                      {description && (
                        <DialogPrimitive.Description className="text-sm text-muted-foreground">
                          {description}
                        </DialogPrimitive.Description>
                      )}
                    </div>
                  )}
                  {/* Radix requires a Title; `headless` means children render <ModalTitle> themselves */}
                  {!title && !headless && <DialogPrimitive.Title className="sr-only">Dialog</DialogPrimitive.Title>}
                  {!description && !headless && <DialogPrimitive.Description className="sr-only" />}

                  <div className="px-6 py-5">{children}</div>

                  {footer && (
                    <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/40 px-6 py-3.5 sm:flex-row sm:justify-end rounded-b-xl">
                      {footer}
                    </div>
                  )}

                  {!hideClose && (
                    <DialogPrimitive.Close
                      className="absolute right-4 top-4 grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      aria-label="Close"
                    >
                      <X className="size-4" />
                    </DialogPrimitive.Close>
                  )}
                </motion.div>
              </DialogPrimitive.Content>
            </div>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}

export const ModalClose = DialogPrimitive.Close
export const ModalTitle = DialogPrimitive.Title
export const ModalDescription = DialogPrimitive.Description
