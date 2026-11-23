import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CircleAlert, CircleCheck } from 'lucide-react'
import { createCampusScene } from '@/lib/campus-scene'
import { ROOM_TYPES, levelLabel } from '@/data/campusLayout'
import { cn } from '@/lib/utils'

/**
 * Interactive 3D Academic Center. Hover (or tap) a room for its tooltip.
 * `rooms` come from placeLocations() and can change without rebuilding the building.
 * The parent sizes it. Exposes the scene controls through `ref`:
 *   resetView(), focusRoom(id), setHighlight(id), setFloor(level | null), setXray(bool), setAutoRotate(bool), setLight(preset)
 */
export const CampusMap = forwardRef(function CampusMap({ rooms, className, onSelect, onReady, onError }, ref) {
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const tipRef = useRef(null)
  const posRef = useRef({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(null)

  // Latest props without rebuilding the scene when the parent re-renders.
  const latest = useRef({ rooms, onSelect, onReady, onError })
  useLayoutEffect(() => {
    latest.current = { rooms, onSelect, onReady, onError }
  })

  useImperativeHandle(ref, () => ({
    resetView: () => sceneRef.current?.resetView(),
    focusRoom: (id) => sceneRef.current?.focusRoom(id),
    setHighlight: (id) => sceneRef.current?.setHighlight(id),
    setFloor: (level) => sceneRef.current?.setFloor(level),
    setXray: (v) => sceneRef.current?.setXray(v),
    setAutoRotate: (v) => sceneRef.current?.setAutoRotate(v),
    setLight: (preset) => sceneRef.current?.setLight(preset),
  }))

  // The building is built once per mount; StrictMode's double mount is safe thanks to dispose().
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let scene
    try {
      scene = createCampusScene(canvas, {
        rooms: latest.current.rooms,
        roomTypes: ROOM_TYPES,
        onHover: (room, x, y) => {
          posRef.current = { x, y }
          placeTip()
          setHovered((prev) => (prev?.id === room?.id ? prev : room))
        },
        onSelect: (room) => latest.current.onSelect?.(room),
      })
      sceneRef.current = scene
      latest.current.onReady?.()
    } catch (error) {
      console.error(error)
      latest.current.onError?.(error)
    }
    return () => {
      scene?.dispose()
      sceneRef.current = null
    }
  }, [])

  // New or refetched locations: swap only the room volumes.
  useEffect(() => {
    sceneRef.current?.setRooms(rooms)
  }, [rooms])

  // Moves the tooltip without a React render; flips it left/up near the container edges.
  function placeTip() {
    const tip = tipRef.current
    const box = canvasRef.current?.parentElement
    if (!tip || !box) return
    const { x, y } = posRef.current
    const flipX = x + tip.offsetWidth + 24 > box.clientWidth
    const flipY = y + tip.offsetHeight + 24 > box.clientHeight
    tip.style.transform = `translate(${flipX ? x - tip.offsetWidth - 14 : x + 14}px, ${flipY ? y - tip.offsetHeight - 14 : y + 14}px)`
  }
  useLayoutEffect(placeTip, [hovered])

  const type = hovered ? ROOM_TYPES[hovered.type] : null
  const where = hovered ? [hovered.building, hovered.floor].filter(Boolean).join(' · ') : ''

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <canvas ref={canvasRef} aria-label="3D campus map of the Academic Center" className="absolute inset-0 block size-full" />

      <div ref={tipRef} className="pointer-events-none absolute left-0 top-0 z-10">
        <AnimatePresence>
          {hovered && (
            <motion.div
              key={hovered.id}
              role="tooltip"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
              transition={{ duration: 0.12 }}
              className="w-60 rounded-lg border border-border bg-popover/95 p-3 text-popover-foreground shadow-lg backdrop-blur-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold leading-snug">{hovered.name}</p>
                <span className="font-mono text-[11px] text-muted-foreground">{hovered.code}</span>
              </div>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">{where || levelLabel(hovered.level)}</p>
              <div className="mt-2 flex items-center justify-between gap-2 text-[12px]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: type?.color }} aria-hidden />
                  {type?.label ?? hovered.type}
                </span>
                {hovered.open > 0 ? (
                  <span className="inline-flex items-center gap-1 font-medium text-warning">
                    <CircleAlert className="size-3.5" /> {hovered.open} open {hovered.open === 1 ? 'issue' : 'issues'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <CircleCheck className="size-3.5" /> No open issues
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
})
