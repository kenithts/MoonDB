import { useDeferredValue, useMemo, useState } from 'react'

import { BrowseLayout } from '@/components/browse-layout'
import { FilterGroup } from '@/components/filter-group'
import { GrayWolfInfo } from '@/components/gray-wolf/gray-wolf-info'
import { OrbDialog } from '@/components/gray-wolf/orb-dialog'
import { OrbTile } from '@/components/gray-wolf/orb-tile'
import { matchesQuery, searchText } from '@/lib/cards'
import { useGrayWolf } from '@/lib/data'
import { applyFacets, selectedCount, type Facet, type Selection } from '@/lib/facets'
import {
  METHOD_LABEL,
  METHODS,
  PIECE_LABEL,
  PIECES,
  STEPS,
  optionMethods,
  orbParts,
  sortByFamily,
  stepLabel,
} from '@/lib/gray-wolf'
import type { GrayWolfEnchant } from '@/lib/types'

interface Entry {
  item: GrayWolfEnchant
  text: string
}

const FACETS: Facet<Entry>[] = [
  { key: 'piece', values: (e) => e.item.options.map((o) => o.piece) },
  { key: 'step', values: (e) => e.item.options.map((o) => String(o.step)) },
  { key: 'method', values: (e) => e.item.options.flatMap(optionMethods) },
]

const PIECE_OPTIONS = PIECES.map((p) => ({ value: p, label: PIECE_LABEL[p] }))
const STEP_OPTIONS = STEPS.map((s) => ({ value: String(s), label: `${stepLabel(s)} encantamento`, hint: `slot ${5 - s}` }))
const METHOD_OPTIONS = METHODS.map((m) => ({ value: m, label: METHOD_LABEL[m] }))

function indexText(e: GrayWolfEnchant) {
  return searchText(e, orbParts(e).family, ...e.options.map((o) => PIECE_LABEL[o.piece]))
}

export function GrayWolfTab() {
  const state = useGrayWolf()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [selection, setSelection] = useState<Selection>({})
  const [selected, setSelected] = useState<GrayWolfEnchant | null>(null)
  const data = state.status === 'ready' ? state.data : null

  const index = useMemo<Entry[]>(
    () => (data ? sortByFamily(data.enchants).map((item) => ({ item, text: indexText(item) })) : []),
    [data],
  )

  const { results, counts } = useMemo(() => {
    const searched = index.filter((e) => matchesQuery(e.text, deferredQuery))
    const { results, counts } = applyFacets(searched, FACETS, selection)
    return { results: results.map((e) => e.item), counts }
  }, [index, deferredQuery, selection])

  return (
    <>
      <BrowseLayout
        intro={data && <GrayWolfInfo data={data} />}
        state={state}
        results={results}
        query={query}
        onQueryChange={setQuery}
        placeholder="Buscar Wolf Orb por nome, ID ou efeito…"
        noun={['orb encontrado', 'orbs encontrados']}
        activeFilters={selectedCount(selection)}
        onClearFilters={() => setSelection({})}
        filters={
          <>
            <FilterGroup
              title="Onde equipa"
              facet="piece"
              options={PIECE_OPTIONS}
              selection={selection}
              counts={counts.piece}
              onChange={setSelection}
            />
            <FilterGroup
              title="Encantamento"
              facet="step"
              options={STEP_OPTIONS}
              selection={selection}
              counts={counts.step}
              onChange={setSelection}
            />
            <FilterGroup
              title="Como obter"
              facet="method"
              options={METHOD_OPTIONS}
              selection={selection}
              counts={counts.method}
              onChange={setSelection}
            />
          </>
        }
        renderItem={(item) => <OrbTile key={item.id} item={item} onSelect={setSelected} />}
      />
      <OrbDialog item={selected} data={data} onClose={() => setSelected(null)} />
    </>
  )
}
