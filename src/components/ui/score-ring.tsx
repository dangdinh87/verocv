'use client'

import { useEffect, useState } from 'react'

export function ScoreRing({
  score,
  size = 76,
  strokeWidth = 6,
  label,
  className = '',
}: {
  score: number
  size?: number
  strokeWidth?: number
  label?: string
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const [animatedScore, setAnimatedScore] = useState(clamped)

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimatedScore(clamped))
    return () => cancelAnimationFrame(id)
  }, [clamped])

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedScore / 100) * circumference
  const strokeColor = clamped >= 80 ? 'var(--color-mint)' : clamped >= 60 ? 'var(--color-pen)' : 'var(--color-seal)'
  const textTone = clamped >= 80 ? 'text-mint' : clamped >= 60 ? 'text-pen' : 'text-seal'

  return (
    <div
      className={`relative inline-flex shrink-0 flex-col items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Điểm ${label ?? 'ATS'}: ${clamped} trên 100`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-rule)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.22, 1, 0.36, 1), stroke 250ms ease' }}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className={`text-[1.05rem] font-extrabold tabular-nums ${textTone}`}>{clamped}</span>
        {label && <span className="mt-0.5 text-[0.58rem] font-bold uppercase tracking-wider text-ink-3">{label}</span>}
      </div>
    </div>
  )
}
