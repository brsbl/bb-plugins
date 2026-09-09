export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  let index = 0;
  while (index < text.length) {
    const char = text[index];
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
    index += 1;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  if (quoted) throw new Error("CSV ended inside a quoted field");
  return rows;
}

export function parseCsvRecords(text) {
  const [header, ...rows] = parseCsv(text);
  if (!header) return [];
  return rows.map((row, rowIndex) => {
    if (row.length !== header.length) {
      throw new Error(`CSV row ${rowIndex + 2} has ${row.length} fields, expected ${header.length}`);
    }
    return Object.fromEntries(header.map((name, column) => [name, row[column]]));
  });
}

function formatField(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function formatCsv(columns, records) {
  const lines = [columns.map(formatField).join(",")];
  for (const record of records) lines.push(columns.map((name) => formatField(record[name])).join(","));
  return `${lines.join("\n")}\n`;
}
