import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { inputBase } from './input'

export const Textarea = forwardRef(function Textarea({ className, rows = 4, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={cn(inputBase, 'min-h-20 resize-y py-2 leading-relaxed', className)} {...props} />
})
