/**
 * Filtro facetado genérico: cada faceta é um grupo de checkboxes.
 * Dentro de uma faceta as opções são OR; entre facetas, AND.
 */

export type Selection = Record<string, Set<string>>

export interface Facet<T> {
  key: string
  /** Valores da faceta para um item (um item pode ter vários). */
  values: (item: T) => Iterable<string>
}

export interface FacetResult<T> {
  results: T[]
  /**
   * counts[faceta][valor]: quantos itens aquela opção traria, considerando a busca e
   * as *outras* facetas selecionadas (o padrão de lojas online).
   */
  counts: Record<string, Record<string, number>>
}

export function applyFacets<T>(items: T[], facets: Facet<T>[], selection: Selection): FacetResult<T> {
  const counts: Record<string, Record<string, number>> = {}
  for (const f of facets) counts[f.key] = {}
  const results: T[] = []

  for (const item of items) {
    const values = facets.map((f) => [...f.values(item)])
    const matches = facets.map((f, i) => {
      const sel = selection[f.key]
      return !sel || sel.size === 0 || values[i].some((v) => sel.has(v))
    })
    const failing = matches.filter((m) => !m).length

    if (failing === 0) results.push(item)
    for (let i = 0; i < facets.length; i++) {
      // Conta para a faceta i se todas as *outras* facetas batem.
      if (failing === 0 || (failing === 1 && !matches[i])) {
        const c = counts[facets[i].key]
        for (const v of values[i]) c[v] = (c[v] ?? 0) + 1
      }
    }
  }
  return { results, counts }
}

export function toggle(selection: Selection, key: string, value: string): Selection {
  const next = new Set(selection[key])
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return { ...selection, [key]: next }
}

export function selectedCount(selection: Selection) {
  return Object.values(selection).reduce((n, s) => n + s.size, 0)
}
