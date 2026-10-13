import { GRADE_LABEL, GRADE_STYLE, PIECE_LABEL } from '@/lib/automatic'
import { cn } from '@/lib/utils'
import type { AutomaticModule, ModuleGrade } from '@/lib/types'

const PILL = 'inline-flex h-5 items-center gap-1 rounded-full px-2 text-[11px] font-medium ring-1 ring-inset'

export function GradeBadge({ grade, className }: { grade: ModuleGrade; className?: string }) {
  return <span className={cn(PILL, GRADE_STYLE[grade], className)}>{GRADE_LABEL[grade]}</span>
}

/** "Armor ×2": peça que aceita o módulo e o máximo de cópias dele na peça. */
export function PieceBadges({ item }: { item: AutomaticModule }) {
  return (
    <>
      {item.pieces.map((p) => (
        <span key={p.piece} className={cn(PILL, 'bg-muted/60 text-foreground/80 ring-foreground/10')}>
          {PIECE_LABEL[p.piece]}
          <span className="font-mono text-muted-foreground">×{p.max}</span>
        </span>
      ))}
    </>
  )
}
