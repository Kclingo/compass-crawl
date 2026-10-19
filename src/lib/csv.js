export function downloadCsv(filename, headers, rows) {
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')),
  ];
  const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function fetchAll(load) {
  const records = [];
  let cursor;
  let hasMore = true;
  while (hasMore) {
    const page = await load(cursor);
    records.push(...page.items);
    cursor = page.next_cursor;
    hasMore = Boolean(page.has_more);
  }
  return records;
}