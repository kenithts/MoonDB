import { useDeferredValue, useMemo, useState } from 'react'

import { BrowseLayout } from '@/components/browse-layout'
import { FilterGroup } from '@/components/filter-group'
import { EnchantDialog } from '@/components/class-enchants/enchant-dialog'
import { TierBadge } from '@/components/class-enchants/enchant-badges'
import { EnchantTile } from '@/components/class-enchants/enchant-tile'
import { matchesQuery, searchText } from '@/lib/cards'
import {
  ENCHANT_SLOT_LABEL,
  ENCHANT_SLOTS,
  enchantGroup,
  TIER_GROUP_LABEL,
  TIER_GROUPS,
} from '@/lib/class-enchants'
import { useClassEnchants } from '@/lib/data'
import { JOB_GROUPS } from '@/lib/equips'
import { applyFacets, selectedCount, type Facet, type Selection } from '@/lib/facets'
import type { ClassEnchant } from '@/lib/types'

interface Entry {
  item: ClassEnchant
  text: string
}

const FACETS: Facet<Entry>[] = [
  { key: 'job', values: (e) => [e.item.job] },
  { key: 'tier', values: (e) => [e.item.tier] },
  { key: 'slot', values: (e) => [e.item.slot] },
]

const JOB_OPTIONS = JOB_GROUPS.flatMap((g) => [
  { heading: g.heading },
  ...g.jobs.map((j) => ({ value: j.key, label: j.label, hint: j.hint })),
])
const TIER_OPTIONS = TIER_GROUPS.map((t) => ({ value: t, label: TIER_GROUP_LABEL[t] }))
const SLOT_OPTIONS = ENCHANT_SLOTS.map((s) => ({ value: s, label: ENCHANT_SLOT_LABEL[s] }))

function indexText(item: ClassEnchant) {
  return searchText(
    item,
    item.className,
    ...item.stones.flatMap((s) => [String(s.id), s.name]),
    ...item.combos.flatMap((c) => c.items.map((i) => i.name)),
  )
}

export function ClassEnchantsTab() {
  const enchants = useClassEnchants()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [selection, setSelection] = useState<Selection>({})
  const [selected, setSelected] = useState<ClassEnchant | null>(null)

  const index = useMemo<Entry[]>(
    () => (enchants.status === 'ready' ? enchants.data.map((item) => ({ item, text: indexText(item) })) : []),
    [enchants],
  )

  const { results, counts } = useMemo(() => {
    const searched = index.filter((e) => matchesQuery(e.text, deferredQuery))
    const { results, counts } = applyFacets(searched, FACETS, selection)
    return { results: results.map((e) => e.item), counts }
  }, [index, deferredQuery, selection])

  return (
    <>
      <BrowseLayout
        state={enchants}
        results={results}
        query={query}
        onQueryChange={setQuery}
        placeholder="Buscar pedra por classe, nome, ID ou efeito…"
        noun={['encantamento encontrado', 'encantamentos encontrados']}
        activeFilters={selectedCount(selection)}
        onClearFilters={() => setSelection({})}
        filters={
          <>
            <FilterGroup
              title="Classe"
              facet="job"
              options={JOB_OPTIONS}
              selection={selection}
              counts={counts.job}
              onChange={setSelection}
              hideEmpty
            />
            <FilterGroup
              title="Geração da classe"
              facet="tier"
              options={TIER_OPTIONS}
              selection={selection}
              counts={counts.tier}
              onChange={setSelection}
            />
            <FilterGroup
              title="Posição no costume"
              facet="slot"
              options={SLOT_OPTIONS}
              selection={selection}
              counts={counts.slot}
              onChange={setSelection}
            />
          </>
        }
        groupOf={enchantGroup}
        renderGroup={(item) => (
          <div className="flex items-center gap-2 border-b border-border pb-1.5">
            <h3 className="font-heading text-base font-semibold">{enchantGroup(item)}</h3>
            <TierBadge item={item} />
          </div>
        )}
        renderItem={(item) => <EnchantTile key={item.id} item={item} onSelect={setSelected} />}
      />
      <EnchantDialog item={selected} onClose={() => setSelected(null)} />
    </>
  )
}
