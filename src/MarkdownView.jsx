import React from 'react'

function renderInline(text, keyPrefix) {
  const parts = []
  let remaining = text
  let i = 0
  const pattern = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/
  while (remaining.length > 0) {
    const m = remaining.match(pattern)
    if (!m) {
      parts.push(remaining)
      break
    }
    if (m.index > 0) parts.push(remaining.slice(0, m.index))
    if (m[1] !== undefined) {
      parts.push(<strong key={`${keyPrefix}-b${i}`}>{m[1]}</strong>)
    } else {
      parts.push(
        <a key={`${keyPrefix}-l${i}`} href={m[3]} target="_blank" rel="noreferrer">
          {m[2]}
        </a>
      )
    }
    remaining = remaining.slice(m.index + m[0].length)
    i++
  }
  return parts
}

function parseBlocks(markdown) {
  const lines = markdown.split('\n')
  const blocks = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', text: line.slice(2) })
      i++
    } else if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.slice(3) })
      i++
    } else if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: line.slice(4) })
      i++
    } else if (line.startsWith('|')) {
      const rows = []
      while (i < lines.length && lines[i].startsWith('|')) {
        const cells = lines[i]
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim())
        if (!cells.every((c) => /^-{2,}$/.test(c) || c === '')) {
          rows.push(cells)
        }
        i++
      }
      blocks.push({ type: 'table', rows })
    } else if (/^\d+\.\s/.test(line)) {
      const items = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''))
        i++
      }
      blocks.push({ type: 'ol', items })
    } else if (line.startsWith('- ')) {
      const items = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2))
        i++
      }
      blocks.push({ type: 'ul', items })
    } else if (line === '') {
      i++
    } else {
      blocks.push({ type: 'p', text: line })
      i++
    }
  }
  return blocks
}

export default function MarkdownView({ markdown }) {
  const blocks = parseBlocks(markdown)
  return (
    <article className="markdown">
      {blocks.map((b, idx) => {
        const key = `blk-${idx}`
        switch (b.type) {
          case 'h1':
            return <h1 key={key}>{renderInline(b.text, key)}</h1>
          case 'h2':
            return <h2 key={key}>{renderInline(b.text, key)}</h2>
          case 'h3':
            return <h3 key={key}>{renderInline(b.text, key)}</h3>
          case 'p':
            return <p key={key}>{renderInline(b.text, key)}</p>
          case 'ol':
            return (
              <ol key={key}>
                {b.items.map((it, j) => (
                  <li key={`${key}-${j}`}>{renderInline(it, `${key}-${j}`)}</li>
                ))}
              </ol>
            )
          case 'ul':
            return (
              <ul key={key}>
                {b.items.map((it, j) => (
                  <li key={`${key}-${j}`}>{renderInline(it, `${key}-${j}`)}</li>
                ))}
              </ul>
            )
          case 'table': {
            const [head, ...body] = b.rows
            const hasHead = head && head.some((c) => c !== '')
            return (
              <table key={key}>
                {hasHead && (
                  <thead>
                    <tr>
                      {head.map((c, j) => (
                        <th key={`${key}-h${j}`}>{renderInline(c, key)}</th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {body.map((row, r) => (
                    <tr key={`${key}-r${r}`}>
                      {row.map((c, j) => (
                        <td key={`${key}-r${r}c${j}`}>
                          {renderInline(c, `${key}-r${r}c${j}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
          default:
            return null
        }
      })}
    </article>
  )
}
