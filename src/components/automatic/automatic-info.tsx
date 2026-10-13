import { ChevronDown, Info } from 'lucide-react'

import { GradeBadge } from '@/components/automatic/module-badges'
import { GRADES, PIECE_LABEL, PIECES, pieceLimits } from '@/lib/automatic'
import type { AutomaticModule } from '@/lib/types'

/**
 * Como funcionam os encantamentos Automatic — regras do NPC Lisa
 * (rAthena: npc/re/merchants/enchan_sage_legacy_17_2.txt). A tabela é calculada dos dados.
 */
export function AutomaticInfo({ modules }: { modules: AutomaticModule[] }) {
  const limits = pieceLimits(modules)

  return (
    <details open className="group rounded-xl bg-primary/5 ring-1 ring-primary/20">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <Info className="size-4 shrink-0 text-primary" />
        Como funcionam os encantamentos Automatic
        <ChevronDown className="ml-auto size-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>

      <div className="flex flex-col gap-4 px-4 pb-4 text-sm leading-relaxed">
        <ul className="ml-1 flex list-disc flex-col gap-1.5 pl-5 text-foreground/90 marker:text-primary/60">
          <li>
            Os <b>módulos</b> são aplicados pela NPC <b>Lisa</b> (ba_in01 87, 370) nos equipamentos Automatic: Armor,
            Engine Wing, Leg e Booster/Battle Chip (Type A e B). No equipamento, o módulo vira um <b>Orb</b> com o efeito.
          </li>
          <li>
            Você precisa estar <b>com a peça equipada</b> e com o módulo no inventário. O módulo é consumido; o encantamento
            tem <b>100% de sucesso</b>, não quebra a peça e <b>mantém o refino</b>, mas <b>não pode ser desfeito</b>.
          </li>
          <li>
            Cada peça recebe no máximo <b>3 módulos</b> (slots 4, 3 e 2, nessa ordem). Escolha bem: depois de cheia, não
            dá para trocar.
          </li>
          <li>
            <b>Repetir é permitido</b> até o limite de cópias de cada módulo naquela peça (tabela abaixo). Módulos
            diferentes da mesma raridade podem ser combinados.
          </li>
          <li>
            <b>Legendary</b> só encaixa na <b>Leg</b> (1 de cada); <b>Epic</b> só na <b>Armor</b> (até 2 do mesmo).
          </li>
          <li>
            A maioria dos efeitos <b>aumenta com o refino da peça</b>, geralmente em <b>+9</b> e <b>+11</b>.
          </li>
        </ul>

        <div className="overflow-x-auto rounded-lg bg-card ring-1 ring-foreground/10">
          <table className="w-full text-xs">
            <caption className="px-3 pt-2.5 pb-1 text-left text-[11px] text-muted-foreground">
              Máximo de cópias do <b>mesmo</b> módulo por peça (e quantos módulos daquela raridade a peça aceita)
            </caption>
            <thead>
              <tr className="text-muted-foreground">
                <th className="px-3 py-2 text-left font-medium">Peça</th>
                {GRADES.map((g) => (
                  <th key={g} className="px-2 py-2 text-center font-medium">
                    <GradeBadge grade={g} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PIECES.map((piece) => (
                <tr key={piece}>
                  <td className="px-3 py-2 font-medium whitespace-nowrap">{PIECE_LABEL[piece]}</td>
                  {GRADES.map((g) => {
                    const cell = limits[piece][g]
                    return (
                      <td key={g} className="px-2 py-2 text-center whitespace-nowrap">
                        {cell ? (
                          <>
                            <span className="font-mono font-medium">
                              ×{cell.min === cell.max ? cell.max : `${cell.min}–${cell.max}`}
                            </span>
                            <span className="ml-1 text-[10px] text-muted-foreground">({cell.count})</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  )
}
