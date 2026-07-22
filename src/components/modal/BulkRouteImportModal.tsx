import React, { useRef, useState } from 'react';
import { DefaultModal } from './DefaultModal';
import { parseSpreadsheet, downloadTemplate } from '../../lib/parseSpreadsheet';
import { CARGO_TYPES, FREQUENCIES } from '../../lib/data/logisticsNetwork';
import type { CargoType, Frequency, LogisticsRoute } from '../../lib/data/logisticsNetwork';

interface BulkRouteImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (routes: LogisticsRoute[]) => void;
}

type RowStatus = 'pending' | 'success' | 'error';

interface PreviewRow {
  business_name: string;
  origin_state: string;
  origin_address: string;
  destination_state: string;
  destination_address: string;
  cargo_type: string;
  frequency: string;
  preferred_date: string;
  status: RowStatus;
  error?: string;
}

const REQUIRED_HEADERS = ['business_name', 'origin_state', 'origin_address', 'destination_state', 'destination_address'];
const TEMPLATE_HEADERS = [
  'business_name',
  'origin_state',
  'origin_address',
  'destination_state',
  'destination_address',
  'cargo_type',
  'frequency',
  'preferred_date',
];

export const BulkRouteImportModal: React.FC<BulkRouteImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);

  const handleFile = async (file: File) => {
    setParseError('');
    setRows([]);
    setDone(false);
    try {
      const raw = await parseSpreadsheet(file);
      if (raw.length === 0) { setParseError('The file is empty.'); return; }

      const headers = Object.keys(raw[0]).map((h) => h.toLowerCase());
      const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
      if (missing.length > 0) {
        setParseError(`Missing columns: ${missing.join(', ')}`);
        return;
      }

      const preview: PreviewRow[] = raw.map((r) => ({
        business_name: r.business_name?.trim() ?? '',
        origin_state: r.origin_state?.trim() ?? '',
        origin_address: r.origin_address?.trim() ?? '',
        destination_state: r.destination_state?.trim() ?? '',
        destination_address: r.destination_address?.trim() ?? '',
        cargo_type: r.cargo_type?.trim() ?? '',
        frequency: r.frequency?.trim() ?? '',
        preferred_date: r.preferred_date?.trim() ?? '',
        status: 'pending',
      }));
      setRows(preview);
    } catch (e: any) {
      setParseError(e.message ?? 'Failed to parse file.');
    }
  };

  const handleImport = async () => {
    setImporting(true);
    const updated = [...rows];
    const created: LogisticsRoute[] = [];

    for (let i = 0; i < updated.length; i++) {
      const row = updated[i];
      // Simulated per-row processing delay — dummy import, no backend yet.
      await new Promise((r) => setTimeout(r, 250));

      if (!row.business_name || !row.origin_state || !row.destination_state || !row.origin_address || !row.destination_address) {
        updated[i] = { ...row, status: 'error', error: 'Missing required fields' };
        setRows([...updated]);
        continue;
      }

      const route: LogisticsRoute = {
        id: `RT-${Math.floor(1000 + Math.random() * 9000)}`,
        businessName: row.business_name,
        originState: row.origin_state,
        originAddress: row.origin_address,
        destinationState: row.destination_state,
        destinationAddress: row.destination_address,
        cargoType: (CARGO_TYPES.find((c) => c === row.cargo_type) as CargoType) ?? 'General Goods',
        frequency: (FREQUENCIES.find((f) => f === row.frequency) as Frequency) ?? 'One-time',
        preferredDate: row.preferred_date || new Date().toISOString().slice(0, 10),
        status: 'Active',
        createdAt: new Date().toISOString().slice(0, 10),
      };
      created.push(route);
      updated[i] = { ...row, status: 'success' };
      setRows([...updated]);
    }

    if (created.length > 0) onImport(created);
    setImporting(false);
    setDone(true);
  };

  const handleClose = () => {
    setRows([]);
    setParseError('');
    setDone(false);
    onClose();
  };

  const successCount = rows.filter((r) => r.status === 'success').length;
  const errorCount = rows.filter((r) => r.status === 'error').length;

  return (
    <DefaultModal isOpen={isOpen} onClose={handleClose} title="Bulk Import Routes" subtitle="Upload multiple departure and arrival routes at once">
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-800">Download template</p>
            <p className="text-xs text-gray-400">Fill in the template then upload it below</p>
          </div>
          <button
            type="button"
            onClick={() => downloadTemplate(TEMPLATE_HEADERS, 'route_template.xlsx')}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#F14724] hover:underline shrink-0"
          >
            <i className="ri-download-2-line text-base" />
            Template
          </button>
        </div>

        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        >
          <i className="ri-file-upload-line text-3xl text-gray-300 mb-2 block" />
          <p className="text-sm font-medium text-gray-600">Drop file here or <span className="text-[#F14724]">browse</span></p>
          <p className="text-xs text-gray-400 mt-1">Accepts .csv and .xlsx</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        {parseError && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">
            <i className="ri-error-warning-line text-base" />
            {parseError}
          </div>
        )}

        {rows.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Preview — {rows.length} row{rows.length !== 1 ? 's' : ''}
            </p>
            <div className="rounded-xl border border-gray-100 overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 text-gray-500 font-semibold">Business</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-semibold">Origin</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-semibold">Destination</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="px-3 py-2 text-gray-700 truncate max-w-[120px]">{row.business_name || '—'}</td>
                      <td className="px-3 py-2 text-gray-700">{row.origin_state || '—'}</td>
                      <td className="px-3 py-2 text-gray-700">{row.destination_state || '—'}</td>
                      <td className="px-3 py-2">
                        {row.status === 'pending' && <span className="text-gray-400">—</span>}
                        {row.status === 'success' && <i className="ri-checkbox-circle-line text-green-500 text-sm" />}
                        {row.status === 'error' && (
                          <span className="text-red-500" title={row.error}>
                            <i className="ri-close-circle-line text-sm" />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {done && (
              <p className="text-xs mt-2 text-gray-500">
                Done: <span className="text-green-600 font-semibold">{successCount} succeeded</span>
                {errorCount > 0 && <>, <span className="text-red-500 font-semibold">{errorCount} failed</span></>}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            {done ? 'Close' : 'Cancel'}
          </button>
          {rows.length > 0 && !done && (
            <button
              type="button"
              onClick={handleImport}
              disabled={importing}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#F14724] hover:bg-[#d63d1e] rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {importing && <i className="ri-loader-4-line animate-spin text-base" />}
              {importing ? 'Importing…' : `Import ${rows.length} routes`}
            </button>
          )}
        </div>
      </div>
    </DefaultModal>
  );
};
