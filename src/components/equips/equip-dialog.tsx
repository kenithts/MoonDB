import type { ReactNode } from 'react'

import { DetailSection, ItemDetailDialog } from '@/components/item-detail'
import { EquipImage } from '@/components/equips/equip-image'
import { FourthBadge, TypeBadge } from '@/components/equips/equip-badges'
import { equipName, JOB_LABEL, tierSummary, typeLabel } from '@/lib/equips'
import type { EquipItem } from '@/lib/types'

const POSITION: Record<string, string> = {
  Head_Top: 'Topo',
  Head_Mid: 'Meio',
  Head_Low: 'Baixo',
  Costume_Head_Top: 'Topo',
  Costume_Head_Mid: 'Meio',
  Costume_Head_Low: 'Baixo',
  Costume_Garment: 'Capa',
  Right_Accessory: 'Direita',
  Left_Accessory: 'Esquerda',
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium tabular-nums">{children}</dd>
    </div>
  )
}

function Stats({ item }: { item: EquipItem }) {
  const positions = [...new Set(item.locations.map((l) => POSITION[l]).filter(Boolean))]
  const level = item.levelMax ? `${item.levelMin ?? 1}–${item.levelMax}` : item.levelMin
  return (
    <dl className="grid grid-cols-3 gap-x-4 gap-y-2.5 rounded-lg bg-muted/50 p-3 sm:grid-cols-4">
      <Stat label="Tipo">{typeLabel(item)}</Stat>
      {positions.length > 0 && <Stat label="Posição">{positions.join(' + ')}</Stat>}
      {item.attack != null && <Stat label="Ataque">{item.attack}</Stat>}
      {item.magicAttack != null && <Stat label="Ataque mágico">{item.magicAttack}</Stat>}
      {item.defense != null && <Stat label="Defesa">{item.defense}</Stat>}
      {item.weaponLevel != null && <Stat label="Nível da arma">{item.weaponLevel}</Stat>}
      {item.armorLevel != null && <Stat label="Nível da armadura">{item.armorLevel}</Stat>}
      {item.range != null && <Stat label="Alcance">{item.range}</Stat>}
      {level != null && <Stat label="Nível base">{level}</Stat>}
      <Stat label="Slots">{item.slots}</Stat>
      <Stat label="Peso">{item.weight}</Stat>
      {item.buy != null && <Stat label="Preço">{item.buy.toLocaleString('pt-BR')} z</Stat>}
      <Stat label="Refinável">{item.refineable ? 'Sim' : 'Não'}</Stat>
      {item.gender && <Stat label="Gênero">{item.gender === 'Female' ? 'Feminino' : 'Masculino'}</Stat>}
    </dl>
  )
}

function WhoEquips({ item }: { item: EquipItem }) {
  const tiers = tierSummary(item.classes)
  return (
    <DetailSection title="Quem equipa">
      {item.jobs ? (
        <div className="flex flex-wrap gap-1.5">
          {item.jobs.map((job) => (
            <span key={job} className="rounded-md bg-muted px-2 py-0.5 text-xs">
              {JOB_LABEL[job] ?? job}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm">Todas as classes</p>
      )}
      {tiers && <p className="text-xs text-muted-foreground">Restrição: {tiers}</p>}
    </DetailSection>
  )
}

export function EquipDialog({ item, onClose }: { item: EquipItem | null; onClose: () => void }) {
  return (
    <ItemDetailDialog
      item={item}
      onClose={onClose}
      title={item && equipName(item)}
      scripts={[
        { label: 'Bônus', code: item?.script },
        { label: 'Ao equipar', code: item?.equipScript },
        { label: 'Ao desequipar', code: item?.unequipScript },
      ]}
      image={item && <EquipImage item={item} className="rounded-lg p-2" />}
    >
      {item && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge item={item} />
            <FourthBadge item={item} />
          </div>
          <Stats item={item} />
          <WhoEquips item={item} />
        </>
      )}
    </ItemDetailDialog>
  )
}
