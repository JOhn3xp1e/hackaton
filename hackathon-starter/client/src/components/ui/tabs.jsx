import { createContext, useContext, useId, useState } from 'react'
import { Tabs as TabsPrimitive } from 'radix-ui'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

const TabsCtx = createContext({ value: undefined, layoutId: 'tabs', variant: 'underline' })

/**
 * Tabs (Radix) with an animated active indicator.
 *   <Tabs defaultValue="overview" variant="underline | pill">
 *     <TabsList>
 *       <TabsTrigger value="overview">Overview</TabsTrigger>
 *       <TabsTrigger value="activity">Activity</TabsTrigger>
 *     </TabsList>
 *     <TabsContent value="overview">…</TabsContent>
 *   </Tabs>
 */
export function Tabs({ value: controlled, defaultValue, onValueChange, variant = 'underline', className, ...props }) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const value = controlled ?? uncontrolled
  const layoutId = useId()

  const handleChange = (v) => {
    if (controlled === undefined) setUncontrolled(v)
    onValueChange?.(v)
  }

  return (
    <TabsCtx.Provider value={{ value, layoutId, variant }}>
      <TabsPrimitive.Root value={value} onValueChange={handleChange} className={cn('grid gap-4', className)} {...props} />
    </TabsCtx.Provider>
  )
}

export function TabsList({ className, ...props }) {
  const { variant } = useContext(TabsCtx)
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex items-center',
        variant === 'underline' ? 'gap-5 border-b border-border w-full' : 'gap-1 rounded-lg border border-border bg-muted p-1 w-fit',
        className,
      )}
      {...props}
    />
  )
}

export function TabsTrigger({ className, value, children, ...props }) {
  const { value: active, layoutId, variant } = useContext(TabsCtx)
  const isActive = active === value

  return (
    <TabsPrimitive.Trigger
      value={value}
      className={cn(
        'relative inline-flex items-center gap-1.5 text-sm font-medium transition-colors outline-none',
        'text-muted-foreground hover:text-foreground data-[state=active]:text-foreground',
        'focus-visible:ring-2 focus-visible:ring-ring/30 rounded-sm [&_svg]:size-4',
        variant === 'underline' ? 'pb-2.5 -mb-px' : 'h-7 px-3',
        className,
      )}
      {...props}
    >
      {isActive && (
        <motion.span
          layoutId={layoutId}
          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
          className={cn(
            'absolute',
            variant === 'underline'
              ? 'inset-x-0 -bottom-px h-[2px] bg-foreground'
              : 'inset-0 rounded-md bg-card shadow-sm border border-border',
          )}
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-1.5">{children}</span>
    </TabsPrimitive.Trigger>
  )
}

export function TabsContent({ className, ...props }) {
  return <TabsPrimitive.Content className={cn('outline-none', className)} {...props} />
}
