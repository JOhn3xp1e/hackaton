import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { MotionConfig } from 'motion/react'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { ToastProvider } from '@/components/ui/toast'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/providers/AuthProvider'
import { isSupabaseConfigured } from '@/lib/supabase'
import App from './App'
import '@/styles/globals.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        {/* reducedMotion="user" → Motion disables transform animations for users who prefer reduced motion */}
        <MotionConfig reducedMotion="user">
          <TooltipProvider>
            <ToastProvider>
              {isSupabaseConfigured ? (
                <AuthProvider>
                  <App />
                </AuthProvider>
              ) : (
                <App />
              )}
            </ToastProvider>
          </TooltipProvider>
        </MotionConfig>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
