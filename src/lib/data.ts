import { useEffect, useState } from 'react'

import type { AutomaticModule, CardItem, ClassEnchant, EquipItem } from '@/lib/types'

/** Caminho de um arquivo em public/, respeitando o base do GitHub Pages. */
export function asset(path: string) {
  return `${import.meta.env.BASE_URL}${path}`
}

export function cardImage(id: number) {
  return asset(`img/cards/${id}.webp`)
}

export function itemImage(id: number) {
  return asset(`img/items/${id}.webp`)
}

export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ready'; data: T }

// Os JSONs são grandes (equips.json ~11 MB): baixa e parseia uma vez só por sessão,
// mesmo que a aba seja desmontada e montada de novo.
const cache = new Map<string, Promise<unknown>>()

function load<T>(path: string): Promise<T> {
  let p = cache.get(path)
  if (!p) {
    p = fetch(asset(path)).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    })
    p.catch(() => cache.delete(path))
    cache.set(path, p)
  }
  return p as Promise<T>
}

function useJson<T>(path: string): LoadState<T> {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    load<T>(path)
      .then((data) => !cancelled && setState({ status: 'ready', data }))
      .catch((err: Error) => !cancelled && setState({ status: 'error', error: err.message }))
    return () => {
      cancelled = true
    }
  }, [path])

  return state
}

export const useCards = () => useJson<CardItem[]>('data/cards.json')
export const useEquips = () => useJson<EquipItem[]>('data/equips.json')
export const useClassEnchants = () => useJson<ClassEnchant[]>('data/class_enchants.json')
export const useAutomatic = () => useJson<AutomaticModule[]>('data/automatic.json')
