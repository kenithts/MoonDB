import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { Search, SearchX, SlidersHorizontal, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type { LoadState } from '@/lib/data'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 48

export const BROWSE_GRID = 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'

/**
 * Página de navegação de um tipo de item: busca + painel de filtros + grid com scroll infinito.
 * Os filtros e o conteúdo de cada item ficam com quem usa.
 */
export function BrowseLayout<T>({
  state,
  results,
  query,
  onQueryChange,
  placeholder,
  noun,
  activeFilters,
  onClearFilters,
  filters,
  renderItem,
  groupOf,
  renderGroup,
  intro,
}: {
  state: LoadState<unknown>
  results: T[]
  query: string
  onQueryChange: (query: string) => void
  placeholder: string
  /** Singular e plural, ex.: ['carta encontrada', 'cartas encontradas']. */
  noun: [string, string]
  activeFilters: number
  onClearFilters: () => void
  filters: ReactNode
  renderItem: (item: T) => ReactNode
  /** Opcional: chave de grupo; um título é inserido no grid sempre que ela muda. */
  groupOf?: (item: T) => string
  /** Título do grupo (recebe o primeiro item do grupo); padrão: a própria chave. */
  renderGroup?: (item: T) => ReactNode
  /** Opcional: conteúdo acima da busca (ex.: um quadro explicativo). */
  intro?: ReactNode
}) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const sentinel = useRef<HTMLDivElement>(null)

  // Volta para a primeira página quando a busca ou os filtros mudam.
  const [lastResults, setLastResults] = useState(results)
  if (lastResults !== results) {
    setLastResults(results)
    setVisible(PAGE_SIZE)
  }

  // Carrega mais itens ao chegar perto do fim da grid.
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible((v) => v + PAGE_SIZE),
      { rootMargin: '600px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [results, visible])

  return (
    <div className="flex flex-col gap-5">
      {intro}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-10 pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label="Limpar busca"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 sm:ml-auto">
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
            className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm ring-1 ring-foreground/15 hover:bg-muted lg:hidden"
          >
            <SlidersHorizontal className="size-4" />
            Filtros
            {activeFilters > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                {activeFilters}
              </span>
            )}
          </button>
          {state.status === 'ready' && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              <span className="font-medium text-foreground tabular-nums">{results.length.toLocaleString('pt-BR')}</span>{' '}
              {results.length === 1 ? noun[0] : noun[1]}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[14rem_1fr] lg:items-start lg:gap-8">
        <aside
          className={cn(
            'flex flex-col gap-5 rounded-xl bg-card p-4 ring-1 ring-foreground/10',
            'lg:sticky lg:top-4 lg:flex lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto lg:bg-transparent lg:px-1 lg:py-1 lg:ring-0 lg:[scrollbar-width:thin]',
            !filtersOpen && 'hidden',
          )}
        >
          {filters}
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={onClearFilters}
              className="self-start rounded-md px-2 text-sm text-primary hover:underline"
            >
              Limpar filtros ({activeFilters})
            </button>
          )}
        </aside>

        <div className="min-w-0">
          {state.status === 'loading' && (
            <div className={BROWSE_GRID}>
              {Array.from({ length: 12 }, (_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          )}

          {state.status === 'error' && (
            <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
              Não foi possível carregar os dados ({state.error}).
            </p>
          )}

          {state.status === 'ready' && results.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-20 text-center text-muted-foreground">
              <SearchX className="size-10 opacity-50" />
              <p className="text-sm">Nada encontrado com essa busca e filtros.</p>
            </div>
          )}

          {results.length > 0 && (
            <>
              <div className={BROWSE_GRID}>
                {results.slice(0, visible).map((item, i, page) => {
                  const group = groupOf?.(item)
                  const newGroup = group !== undefined && (i === 0 || groupOf!(page[i - 1]) !== group)
                  return (
                    <Fragment key={i}>
                      {newGroup && (
                        <div className="col-span-full pt-4 first:pt-0">{renderGroup ? renderGroup(item) : group}</div>
                      )}
                      {renderItem(item)}
                    </Fragment>
                  )
                })}
              </div>
              {visible < results.length && <div ref={sentinel} className="h-px" />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
