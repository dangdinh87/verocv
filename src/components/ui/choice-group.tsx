'use client'

// Single choice among a few options, drawn as filled pills (a state toggle, not navigation).
export function ChoiceGroup<T extends string>({
  legend,
  value,
  options,
  onChange,
  hideLegend = false,
}: {
  legend: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  hideLegend?: boolean
}) {
  return (
    <fieldset>
      <legend className={hideLegend ? 'sr-only' : 'text-sm font-semibold text-ink-2'}>{legend}</legend>
      <div role="radiogroup" aria-label={legend} className={`${hideLegend ? '' : 'mt-2 '}flex flex-wrap gap-2`}>
        {options.map((o) => {
          const active = o.value === value
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.value)}
              className={`h-10 cursor-pointer rounded-full px-4 text-[0.95rem] font-semibold transition-colors ${
                active ? 'bg-pen text-white' : 'border border-rule text-ink-2 hover:border-ink/40 hover:text-ink'
              }`}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
