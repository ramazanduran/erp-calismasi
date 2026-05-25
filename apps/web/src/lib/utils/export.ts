export function downloadCSV(
  data: Record<string, unknown>[],
  filename: string,
  headers: Record<string, string>,
) {
  const headerRow = Object.values(headers).join(',');
  const rows = data.map((row) =>
    Object.keys(headers)
      .map((key) => {
        const val = row[key] ?? '';
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      })
      .join(','),
  );
  const csv = [headerRow, ...rows].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
