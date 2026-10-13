import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import { toggle, type Selection } from '@/lib/facets'
import { cn } from '@/lib/utils'

export interface FilterOptionDef {
  value: string
  label: string
  hint?: string
  icon?: LucideIcon
  iconClassName?: string
}

export function FilterHeading({ children }: { children: ReactNode }) {
  return <p className="px-2 pt-2 pb-0.5 text-[11px] font-medium text-muted-foreground/70">{children}</p>
}

/** Um grupo de checkboxes ligado a uma faceta de `applyFacets`. */
export function FilterGroup({
  title,
  facet,
  options,
  selection,
  counts,
  onChange,
  hideEmpty = false,
}: {
  title: string
  facet: string
  options: (FilterOptionDef | { heading: string })[]
  selection: Selection
  counts: Record<string, number> | undefined
  onChange: (selection: Selection) => void
  /** Esconde opções sem resultados (útil em listas longas). */
  hideEmpty?: boolean
}) {
  const selected = selection[facet] ?? new Set<string>()
  return (
    <fieldset className="flex min-w-0 flex-col gap-0.5">
      <legend className="mb-1.5 px-0 text-xs font-medium tracking-wider text-muted-foreground uppercase">{title}</legend>
      {options.map((opt) => {
        if ('heading' in opt) return <FilterHeading key={`h-${opt.heading}`}>{opt.heading}</FilterHeading>
        const count = counts?.[opt.value] ?? 0
        const checked = selected.has(opt.value)
        if (hideEmpty && count === 0 && !checked) return null
        const Icon = opt.icon
        return (
          <label
            key={opt.value}
            className={cn(
              'flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted',
              count === 0 && !checked && 'opacity-50',
            )}
          >
            <Checkbox checked={checked} onCheckedChange={() => onChange(toggle(selection, facet, opt.value))} />
            {Icon && <Icon className={cn('size-4 shrink-0', opt.iconClassName)} />}
            <span className="min-w-0 flex-1 leading-tight">
              {opt.label}
              {opt.hint && <span className="block text-[11px] text-muted-foreground">{opt.hint}</span>}
            </span>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">{count}</span>
          </label>
        )
      })}
    </fieldset>
  )
}
