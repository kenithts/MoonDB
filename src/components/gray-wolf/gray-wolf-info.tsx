import { ChevronDown, Info } from 'lucide-react'

import { EquipImage } from '@/components/equips/equip-image'
import { Amethyst, Zeny } from '@/components/gray-wolf/cost'
import { PIECE_LABEL, STEPS, sharedStepCost, stepLabel } from '@/lib/gray-wolf'
import type { GrayWolfData } from '@/lib/types'

/**
 * Como funcionam os encantamentos Gray Wolf — NPC Emmet (rAthena: npc/re/quests/quests_18.txt)
 * com custos e sorteios do db/re/item_enchant.yml. Tabelas calculadas dos dados.
 */
export function GrayWolfInfo({ data }: { data: GrayWolfData }) {
  const { pieces, shop, amethyst, special } = data
  const steps = STEPS.map((step) => ({ step, cost: sharedStepCost(pieces, step) }))
  const last = steps[steps.length - 1].cost
  const reset = pieces[0]?.reset
  const minRefine = [...new Set(pieces.filter((p) => p.minRefine > 0).map((p) => p.minRefine))]
  const refinePieces = pieces.filter((p) => p.minRefine > 0).map((p) => PIECE_LABEL[p.piece])
  const total = steps.reduce(
    (acc, s) => ({ zeny: acc.zeny + (s.cost?.zeny ?? 0), amethyst: acc.amethyst + (s.cost?.amethyst ?? 0) }),
    { zeny: 0, amethyst: 0 },
  )
  const setCost = pieces.reduce(
    (sum, p) => sum + Math.min(...p.equipment.map((e) => shop.find((s) => s.id === e.id)?.amethyst ?? Infinity)),
    0,
  )
  const perfectTotal = last?.perfectCost && {
    zeny: total.zeny - last.zeny + last.perfectCost.zeny,
    amethyst: total.amethyst - last.amethyst + last.perfectCost.amethyst,
  }

  return (
    <details open className="group rounded-xl bg-primary/5 ring-1 ring-primary/20">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <Info className="size-4 shrink-0 text-primary" />
        Como funcionam os encantamentos Gray Wolf
        <ChevronDown className="ml-auto size-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>

      <div className="flex flex-col gap-4 px-4 pb-4 text-sm leading-relaxed">
        <ul className="ml-1 flex list-disc flex-col gap-1.5 pl-5 text-foreground/90 marker:text-primary/60">
          <li>
            Quem encanta é a NPC <b>Emmet</b> (wolfvill 164, 137), liberada depois de avançar na história principal do
            Episódio 18. Ela também troca os equipamentos Gray Wolf por <b>{amethyst.name}</b>.
          </li>
          <li>
            O equipamento precisa estar <b>no inventário</b> (desequipado)
            {minRefine.length > 0 && (
              <>
                {' '}e, em {refinePieces.join(', ')}, refinado no mínimo <b>+{minRefine.join('/')}</b>
              </>
            )}
            . Acessórios não têm refino mínimo.
          </li>
          <li>
            Cada peça recebe <b>3 encantamentos</b>, sempre na ordem <b>slot 4 → 3 → 2</b>. Cada tentativa tem{' '}
            <b>100% de sucesso</b> e não quebra o item, mas o Wolf Orb é <b>sorteado</b> entre os possíveis daquela peça e
            daquele encantamento (as chances estão em cada orb).
          </li>
          {last?.perfectCost && (
            <li>
              No <b>3º encantamento</b> você pode, em vez do sorteio, <b>escolher</b> um orb específico (encantamento
              perfeito) por <Zeny value={last.perfectCost.zeny} /> + <Amethyst value={last.perfectCost.amethyst} />.
            </li>
          )}
          {reset && (
            <li>
              Não gostou? O <b>reset</b> remove <b>todos</b> os encantamentos da peça ({reset.chance}% de sucesso, o refino
              é mantido) por <Zeny value={reset.zeny} /> + <Amethyst value={reset.amethyst} />, e você recomeça do slot 4.
            </li>
          )}
          <li>
            Os efeitos da maioria dos orbs <b>aumentam com o refino</b> da peça (+7, +9 e +11).
          </li>
          <li>
            O <b>{special.name}</b> ({special.description.join(' ')}) permite escolher diretamente o orb de cada
            encantamento. Esse menu existe no rAthena, mas nenhum NPC do rAthena o abre.
          </li>
          <li>
            {amethyst.name} vem das missões e diárias da Gray Wolf Village (Ep. 18) e das instâncias Wolves Gathering
            Place, Sanctuary Purification, Villa of Deception e Thor Gunsu Base
            {amethyst.obtainedFrom.length > 0 && <>; também de {amethyst.obtainedFrom.map((s) => s.name).join(', ')}</>}.
          </li>
        </ul>

        <div className="overflow-x-auto rounded-lg bg-card ring-1 ring-foreground/10">
          <table className="w-full text-xs">
            <caption className="px-3 pt-2.5 pb-1 text-left text-[11px] text-muted-foreground">
              Custo de cada encantamento (igual para todas as peças) e quantos orbs podem sair em cada peça
            </caption>
            <thead>
              <tr className="text-muted-foreground">
                <th className="px-3 py-2 text-left font-medium">Encantamento</th>
                <th className="px-2 py-2 text-left font-medium">Custo</th>
                {pieces.map((p) => (
                  <th key={p.piece} className="px-2 py-2 text-center font-medium whitespace-nowrap">
                    {PIECE_LABEL[p.piece]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {steps.map(({ step, cost }) => (
                <tr key={step}>
                  <td className="px-3 py-2 font-medium whitespace-nowrap">
                    {stepLabel(step)} <span className="font-normal text-muted-foreground">(slot {cost?.slot ?? '?'})</span>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {cost ? (
                      <>
                        <Amethyst value={cost.amethyst} /> + <Zeny value={cost.zeny} />
                        {cost.perfectCost && (
                          <div className="mt-0.5 text-[11px] text-muted-foreground">
                            escolha: <Amethyst value={cost.perfectCost.amethyst} /> + <Zeny value={cost.perfectCost.zeny} />
                          </div>
                        )}
                      </>
                    ) : (
                      'varia por peça'
                    )}
                  </td>
                  {pieces.map((p) => {
                    const s = p.steps.find((x) => x.step === step)
                    return (
                      <td key={p.piece} className="px-2 py-2 text-center whitespace-nowrap">
                        <span className="font-mono font-medium">{s?.random ?? 0}</span>
                        <span className="ml-1 text-[10px] text-muted-foreground">sorteio</span>
                        {!!s?.perfect && (
                          <div className="text-[10px] text-muted-foreground">
                            <span className="font-mono text-foreground/80">{s.perfect}</span> escolha
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {reset && (
                <tr>
                  <td className="px-3 py-2 font-medium">Reset</td>
                  <td className="px-2 py-2 whitespace-nowrap" colSpan={pieces.length + 1}>
                    <Amethyst value={reset.amethyst} /> + <Zeny value={reset.zeny} />
                    <span className="ml-2 text-muted-foreground">remove os 3 encantamentos</span>
                  </td>
                </tr>
              )}
              <tr className="bg-muted/30">
                <td className="px-3 py-2 font-medium">Peça completa</td>
                <td className="px-2 py-2 whitespace-nowrap" colSpan={pieces.length + 1}>
                  <Amethyst value={total.amethyst} /> + <Zeny value={total.zeny} />
                  <span className="ml-2 text-muted-foreground">(3 sorteios)</span>
                  {perfectTotal && (
                    <span className="ml-3">
                      ou <Amethyst value={perfectTotal.amethyst} /> + <Zeny value={perfectTotal.zeny} />
                      <span className="ml-2 text-muted-foreground">(escolhendo o 3º)</span>
                    </span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-lg bg-card ring-1 ring-foreground/10">
          <p className="px-3 pt-2.5 pb-1 text-[11px] text-muted-foreground">
            Troca nas lojas da vila (Emmet e Asad) por {amethyst.name}
          </p>
          <ul className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
            {shop.map((s) => {
              const piece = pieces.find((p) => p.equipment.some((e) => e.id === s.id))
              return (
                <li key={s.id} className="flex items-center gap-2.5 px-3 py-1.5">
                  <EquipImage item={s} lazy className="w-7 shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-xs">
                    {s.name}
                    {piece && <span className="ml-1.5 text-muted-foreground">{PIECE_LABEL[piece.piece]}</span>}
                  </span>
                  <Amethyst value={s.amethyst} className="shrink-0 text-xs" />
                </li>
              )
            })}
          </ul>
          {Number.isFinite(setCost) && (
            <p className="px-3 pt-1 pb-2.5 text-[11px] text-muted-foreground">
              Conjunto com uma peça de cada ({pieces.length}): <Amethyst value={setCost} />
            </p>
          )}
        </div>
      </div>
    </details>
  )
}
