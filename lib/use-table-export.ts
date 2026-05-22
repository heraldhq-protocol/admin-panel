'use client'

/**
 * useTableExport — turns any array of flat objects into a downloadable CSV.
 *
 * Usage:
 *   const { exportCsv } = useTableExport(data, { filename: 'protocols.csv' })
 *   <Button onClick={exportCsv}>Export CSV</Button>
 *
 * Keys in the first row of `data` become column headers.
 * Values are stringified; nested objects/arrays are JSON-serialised.
 */

function escapeCell(value: unknown): string {
  const str =
    value === null || value === undefined
      ? ''
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);

  // RFC 4180: quote cells that contain commas, newlines, or double-quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function useTableExport<T extends Record<string, unknown>>(
  data: T[],
  options: { filename?: string } = {},
) {
  const exportCsv = () => {
    if (!data.length || !data[0]) return;

    const headers = Object.keys(data[0]);
    const rows = [
      headers.map(escapeCell).join(','),
      ...data.map((row) => headers.map((h) => escapeCell(row[h])).join(',')),
    ];

    const blob = new Blob([rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = options.filename ?? 'export.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return { exportCsv };
}
