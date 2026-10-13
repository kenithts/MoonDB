import { useDeferredValue, useMemo, useState } from 'react'

import { BrowseLayout } from '@/components/browse-layout'
import { FilterGroup } from '@/components/filter-group'
import { EquipDialog } from '@/components/equips/equip-dialog'
import { EquipTile } from '@/components/equips/equip-tile'
import { itemOrigins, matchesQuery, ORIGIN_OPTIONS, searchText } from '@/lib/cards'
import { useEquips } from '@/lib/data'
import { ALL_JOBS, CATEGORIES, CATEGORY_INFO, JOB_GROUPS, typeLabel, WEAPON_TYPES } from '@/lib/equips'
import { applyFacets, selectedCount, type Facet, type Selection } from '@/lib/facets'
import type { EquipItem } from '@/lib/types'

interface Entry {
  item: EquipItem
  text: string
}

const FACETS: Facet<Entry>[] = [
  { key: 'category', values: (e) => [e.item.category] },
  { key: 'weapon', values: (e) => (e.item.category === 'Weapon' && e.item.subType ? [e.item.subType] : []) },
  { key: 'job', values: (e) => e.item.jobs ?? ALL_JOBS },
  { key: 'origin', values: (e) => itemOrigins(e.item) },
]

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({
  value: c,
  label: CATEGORY_INFO[c].label,
  icon: CATEGORY_INFO[c].icon,
  iconClassName: CATEGORY_INFO[c].color,
}))

const WEAPON_OPTIONS = Object.entries(WEAPON_TYPES).map(([value, label]) => ({ value, label }))

const JOB_OPTIONS = JOB_GROUPS.flatMap((g) => [
  { heading: g.heading },
  ...g.jobs.map((j) => ({ value: j.key, label: j.label, hint: j.hint })),
])

export function EquipsTab() {
  const equips = useEquips()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [selection, setSelection] = useState<Selection>({})
  const [selected, setSelected] = useState<EquipItem | null>(null)

  const index = useMemo<Entry[]>(
    () =>
      equips.status === 'ready'
        ? equips.data.map((item) => ({ item, text: searchText(item, typeLabel(item)) }))
        : [],
    [equips],
  )

  const { results, counts } = useMemo(() => {
    const searched = index.filter((e) => matchesQuery(e.text, deferredQuery))
    const { results, counts } = applyFacets(searched, FACETS, selection)
    return { results: results.map((e) => e.item), counts }
  }, [index, deferredQuery, selection])

  // O filtro de tipo de arma só faz sentido quando "Arma" está marcada.
  const showWeaponTypes = selection.category?.has('Weapon') ?? false

  return (
    <>
      <BrowseLayout
        state={equips}
        results={results}
        query={query}
        onQueryChange={setQuery}
        placeholder="Buscar equipamento por nome, ID ou efeito…"
        noun={['equipamento encontrado', 'equipamentos encontrados']}
        activeFilters={selectedCount(selection)}
        onClearFilters={() => setSelection({})}
        filters={
          <>
            <FilterGroup
              title="Tipo"
              facet="category"
              options={CATEGORY_OPTIONS}
              selection={selection}
              counts={counts.category}
              onChange={(next) => setSelection(next.category?.has('Weapon') ? next : { ...next, weapon: new Set() })}
            />
            {showWeaponTypes && (
              <FilterGroup
                title="Tipo de arma"
                facet="weapon"
                options={WEAPON_OPTIONS}
                selection={selection}
                counts={counts.weapon}
                onChange={setSelection}
                hideEmpty
              />
            )}
            <FilterGroup
              title="Classe"
              facet="job"
              options={JOB_OPTIONS}
              selection={selection}
              counts={counts.job}
              onChange={setSelection}
            />
            <FilterGroup
              title="Como obter"
              facet="origin"
              options={ORIGIN_OPTIONS}
              selection={selection}
              counts={counts.origin}
              onChange={setSelection}
            />
          </>
        }
        renderItem={(item) => <EquipTile key={item.id} item={item} onSelect={setSelected} />}
      />
      <EquipDialog item={selected} onClose={() => setSelected(null)} />
    </>
  )
}
