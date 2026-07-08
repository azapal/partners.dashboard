import * as XLSX from 'xlsx';

/** Parse a CSV or XLSX File into an array of row objects keyed by column header. */
export function parseSpreadsheet(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
          defval: '',
          raw: false,
        });
        resolve(rows);
      } catch (err) {
        reject(new Error('Could not parse file. Make sure it is a valid CSV or XLSX.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsBinaryString(file);
  });
}

/** Generate and download a template CSV with the given headers. */
export function downloadTemplate(headers: string[], filename: string) {
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, filename);
}
