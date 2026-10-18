import { Skull } from 'lucide-react'

import { mobImage } from '@/lib/data'
import type { CheffeniaMob } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Pose parada do monstro (sprite do client), num quadro de fundo suave. */
export function MobSprite({ mob, className }: { mob: CheffeniaMob; className?: string }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[radial-gradient(ellipse_at_center,oklch(0.8_0.1_285/0.14),transparent_70%)] ring-1 ring-foreground/10',
        className,
      )}
    >
      {mob.sprite && mob.id ? (
        <img src={mobImage(mob.id)} alt="" loading="lazy" decoding="async" className="max-h-full max-w-full object-contain" />
      ) : (
        <Skull className="size-1/3 text-muted-foreground/40" />
      )}
    </div>
  )
}
