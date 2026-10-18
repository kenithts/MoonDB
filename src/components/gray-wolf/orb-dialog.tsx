import { DetailSection, ItemDetailDialog } from '@/components/item-detail'
import { EquipImage } from '@/components/equips/equip-image'
import { Amethyst, Zeny } from '@/components/gray-wolf/cost'
import { PIECE_LABEL, formatPercent, optionsByPiece, stepLabel } from '@/lib/gray-wolf'
import type { GrayWolfData, GrayWolfEnchant } from '@/lib/types'

export function OrbDialog({
  item,
  data,
  onClose,
}: {
  item: GrayWolfEnchant | null
  data: GrayWolfData | null
  onClose: () => void
}) {
  return (
    <ItemDetailDialog
      item={item}
      onClose={onClose}
      hideSources
      scripts={[{ label: 'Efeito', code: item?.script }]}
      image={item && <EquipImage item={item} className="rounded-lg p-2" />}
    >
      {item && data && (
        <DetailSection title="Onde pode sair">
          <div className="overflow-x-auto rounded-lg ring-1 ring-foreground/10">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="px-3 py-2 text-left font-medium">Peça</th>
                  <th className="px-2 py-2 text-left font-medium">Encant.</th>
                  <th className="px-2 py-2 text-right font-medium">Sorteio</th>
                  <th className="px-3 py-2 text-left font-medium">Escolha direta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {optionsByPiece(item).map(({ piece, options }) => {
                  const info = data.pieces.find((p) => p.piece === piece)
                  return options.map((o, i) => (
                    <tr key={`${piece}-${o.step}`}>
                      {i === 0 && (
                        <td rowSpan={options.length} className="px-3 py-2 align-top">
                          <div className="font-medium">{PIECE_LABEL[piece]}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {info?.equipment.map((e) => e.name).join(', ')}
                          </div>
                        </td>
                      )}
                      <td className="px-2 py-2 whitespace-nowrap">
                        {stepLabel(o.step)}{' '}
                        <span className="text-muted-foreground">
                          (slot {info?.steps.find((s) => s.step === o.step)?.slot})
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right font-mono whitespace-nowrap">
                        {o.chance !== undefined ? (
                          formatPercent(o.chance)
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-0.5">
                          {o.perfect && (
                            <span className="whitespace-nowrap">
                              <Amethyst value={o.perfect.amethyst} /> + <Zeny value={o.perfect.zeny} />
                            </span>
                          )}
                          {o.special && (
                            <span className="text-muted-foreground">
                              {o.special}× {data.special.name}
                            </span>
                          )}
                          {!o.perfect && !o.special && <span className="text-muted-foreground/40">—</span>}
                        </div>
                      </td>
                    </tr>
                  ))
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Sorteio = chance de este orb sair no encantamento comum daquela peça e posição.
          </p>
        </DetailSection>
      )}
    </ItemDetailDialog>
  )
}
