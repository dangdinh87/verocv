'use client'

import { useEffect, useRef, useState } from 'react'

export function NumberTicker({
  value,
  prefix = '',
  suffix = '',
  durationMs = 650,
  className = '',
}: {
  value: number
  prefix?: string
  suffix?: string
  durationMs?: number
  className?: string
}) {
  const target = Math.round(value)
  const [display, setDisplay] = useState(target)
  const prevTargetRef = useRef<number | null>(null)

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced || target === 0 || durationMs <= 0) {
      prevTargetRef.current = target
      setDisplay(target)
      return
    }

    const from = prevTargetRef.current === null ? 0 : prevTargetRef.current
    prevTargetRef.current = target

    if (from === target) {
      setDisplay(target)
      return
    }

    let frameId = 0
    const start = performance.now()

    const step = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(1, elapsed / durationMs)
      const eased = 1 - Math.pow(1 - progress, 3)
      const next = Math.round(from + (target - from) * eased)
      setDisplay(next)
      if (progress < 1) {
        frameId = requestAnimationFrame(step)
      }
    }

    frameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameId)
  }, [target, durationMs])

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {display}
      {suffix}
    </span>
  )
}
