import { Fragment } from 'react'

import { COLOR_CODE, isSeparator, readableColor, stripColors } from '@/lib/ro'

/** Renderiza uma linha de texto do client, convertendo ^RRGGBB em spans coloridos. */
export function RoLine({ text }: { text: string }) {
  // split com grupo de captura: [texto, cor, texto, cor, texto...]
  const parts = text.split(COLOR_CODE)
  const out = []
  let color: string | null = null
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      color = parts[i] === '000000' ? null : parts[i]
      continue
    }
    if (!parts[i]) continue
    out.push(
      color ? (
        <span key={i} style={{ color: readableColor(color) }}>
          {parts[i]}
        </span>
      ) : (
        <Fragment key={i}>{parts[i]}</Fragment>
      ),
    )
  }
  return <>{out}</>
}

export function RoText({ lines, className }: { lines: string[]; className?: string }) {
  return (
    <div className={className}>
      {lines.map((line, i) =>
        isSeparator(line) ? (
          <hr key={i} className="my-2.5 border-border" />
        ) : stripColors(line).trim() ? (
          <p key={i}>
            <RoLine text={line} />
          </p>
        ) : (
          <div key={i} className="h-2" />
        ),
      )}
    </div>
  )
}
