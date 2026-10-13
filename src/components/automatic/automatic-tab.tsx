import { useDeferredValue, useMemo, useState } from 'react'

import { BrowseLayout } from '@/components/browse-layout'
import { FilterGroup } from '@/components/filter-group'
import { AutomaticInfo } from '@/components/automatic/automatic-info'
import { GradeBadge } from '@/components/automatic/module-badges'
import { ModuleDialog } from '@/components/automatic/module-dialog'
import { ModuleTile } from '@/components/automatic/module-tile'
import { GRADE_LABEL, GRADES, PIECE_LABEL, PIECES } from '@/lib/automatic'
import { matchesQuery, searchText } from '@/lib/cards'
import { useAutomatic } from '@/lib/data'
import { applyFacets, selectedCount, type Facet, type Selection } from '@/lib/facets'
import type { AutomaticModule } from '@/lib/types'

interface Entry {
  item: AutomaticModule
  text: string
}

const FACETS: Facet<Entry>[] = [
  { key: 'grade', values: (e) => [e.item.grade] },
  { key: 'piece', values: (e) => e.item.pieces.map((p) => p.piece) },
]

const GRADE_OPTIONS = GRADES.map((g) => ({ value: g, label: GRADE_LABEL[g] }))
const PIECE_OPTIONS = PIECES.map((p) => ({ value: p, label: PIECE_LABEL[p] }))

function indexText(m: AutomaticModule) {
  return searchText(
    m,
    GRADE_LABEL[m.grade],
    m.orb?.name,
    m.orb && String(m.orb.id),
    ...m.pieces.map((p) => PIECE_LABEL[p.piece]),
  )
}

export function AutomaticTab() {
  const modules = useAutomatic()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [selection, setSelection] = useState<Selection>({})
  const [selected, setSelected] = useState<AutomaticModule | null>(null)

  const index = useMemo<Entry[]>(
    () => (modules.status === 'ready' ? modules.data.map((item) => ({ item, text: indexText(item) })) : []),
    [modules],
  )

  const { results, counts } = useMemo(() => {
    const searched = index.filter((e) => matchesQuery(e.text, deferredQuery))
    const { results, counts } = applyFacets(searched, FACETS, selection)
    return { results: results.map((e) => e.item), counts }
  }, [index, deferredQuery, selection])

  return (
    <>
      <BrowseLayout
        intro={modules.status === 'ready' && <AutomaticInfo modules={modules.data} />}
        state={modules}
        results={results}
        query={query}
        onQueryChange={setQuery}
        placeholder="Buscar módulo por nome, ID ou efeito…"
        noun={['módulo encontrado', 'módulos encontrados']}
        activeFilters={selectedCount(selection)}
        onClearFilters={() => setSelection({})}
        filters={
          <>
            <FilterGroup
              title="Raridade"
              facet="grade"
              options={GRADE_OPTIONS}
              selection={selection}
              counts={counts.grade}
              onChange={setSelection}
            />
            <FilterGroup
              title="Onde equipa"
              facet="piece"
              options={PIECE_OPTIONS}
              selection={selection}
              counts={counts.piece}
              onChange={setSelection}
            />
          </>
        }
        groupOf={(m) => m.grade}
        renderGroup={(m) => (
          <div className="flex items-center gap-2 border-b border-border pb-1.5">
            <GradeBadge grade={m.grade} className="h-6 px-2.5 text-xs" />
          </div>
        )}
        renderItem={(item) => <ModuleTile key={item.id} item={item} onSelect={setSelected} />}
      />
      <ModuleDialog item={selected} onClose={() => setSelected(null)} />
    </>
  )
}
