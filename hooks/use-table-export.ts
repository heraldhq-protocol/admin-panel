'use client'

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0]!)
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ]
  return lines.join('\n')
}

/**
 * Returns a stable callback that, when invoked, downloads the provided data
 * as a CSV file. Generic over any object shape.
 *
 * Usage:
 *   const exportCSV = useTableExport(data, 'protocols')
 *   <Button onClick={exportCSV}>Export CSV</Button>
 */
export function useTableExport<T extends object>(
  data: T[],
  filename: string,
): () => void {
  return () => {
    const csv = toCSV(data as Record<string, unknown>[])
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}
