import { useDeferredValue, useMemo, useState } from 'react'

import { BrowseLayout } from '@/components/browse-layout'
import { FilterGroup } from '@/components/filter-group'
import { CardDialog } from '@/components/cards/card-dialog'
import { CardTile } from '@/components/cards/card-tile'
import { itemOrigins, matchesQuery, ORIGIN_OPTIONS, searchText, SLOTS } from '@/lib/cards'
import { useCards } from '@/lib/data'
import { applyFacets, selectedCount, type Facet, type Selection } from '@/lib/facets'
import { SLOT_INFO } from '@/lib/ro'
import type { CardItem } from '@/lib/types'

interface Entry {
  card: CardItem
  text: string
}

const FACETS: Facet<Entry>[] = [
  { key: 'slot', values: (e) => e.card.slots },
  { key: 'origin', values: (e) => itemOrigins(e.card) },
]

const SLOT_OPTIONS = SLOTS.map((slot) => ({
  value: slot,
  label: SLOT_INFO[slot].label,
  icon: SLOT_INFO[slot].icon,
  iconClassName: SLOT_INFO[slot].color,
}))

export function CardsTab() {
  const cards = useCards()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [selection, setSelection] = useState<Selection>({})
  const [selected, setSelected] = useState<CardItem | null>(null)

  const index = useMemo<Entry[]>(
    () => (cards.status === 'ready' ? cards.data.map((card) => ({ card, text: searchText(card, card.prefix) })) : []),
    [cards],
  )

  const { results, counts } = useMemo(() => {
    const searched = index.filter((e) => matchesQuery(e.text, deferredQuery))
    const { results, counts } = applyFacets(searched, FACETS, selection)
    return { results: results.map((e) => e.card), counts }
  }, [index, deferredQuery, selection])

  return (
    <>
      <BrowseLayout
        state={cards}
        results={results}
        query={query}
        onQueryChange={setQuery}
        placeholder="Buscar carta por nome, ID ou efeito…"
        noun={['carta encontrada', 'cartas encontradas']}
        activeFilters={selectedCount(selection)}
        onClearFilters={() => setSelection({})}
        filters={
          <>
            <FilterGroup
              title="Onde equipa"
              facet="slot"
              options={SLOT_OPTIONS}
              selection={selection}
              counts={counts.slot}
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
        renderItem={(card) => <CardTile key={card.id} card={card} onSelect={setSelected} />}
      />
      <CardDialog item={selected} onClose={() => setSelected(null)} />
    </>
  )
}
