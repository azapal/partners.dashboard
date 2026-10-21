import React, { useEffect, useRef, useState } from 'react';
import { useCreateBranch } from '../../hooks/useBranchPartner';
import { feedbackActions, feedbackStore } from '../../store/client/feedback';
import { parseSpreadsheet, downloadTemplate } from '../../lib/parseSpreadsheet';

interface BulkBranchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type RowStatus = 'pending' | 'success' | 'error';

interface PreviewRow {
  branch_manager: string;
  branch_code: string;
  country: string;
  address: string;
  lat: string;
  lon: string;
  status: RowStatus;
  error?: string;
}

const REQUIRED_HEADERS = ['branch_manager', 'branch_code', 'country', 'address'];
// lat/lon are optional here — a bulk import is often done without a
// pre-geocoded address; the branch can be edited afterward to pin a location.
const TEMPLATE_HEADERS = ['branch_manager', 'branch_code', 'country', 'address', 'lat', 'lon'];

export const BulkBranchImportModal: React.FC<BulkBranchImportModalProps> = ({ isOpen, onClose }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);

  const { mutateAsync: createBranch } = useCreateBranch({ silent: true });
  // Silent per row — the table shows each row's outcome, and one summary
  // modal at the end replaces what would otherwise be a modal per row.

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
        branch_manager: r.branch_manager?.trim() ?? '',
        branch_code: r.branch_code?.trim() ?? '',
        country: r.country?.trim() ?? '',
        address: r.address?.trim() ?? '',
        lat: r.lat?.trim() ?? '',
        lon: r.lon?.trim() ?? '',
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

    for (let i = 0; i < updated.length; i++) {
      const row = updated[i];
      if (!row.branch_manager || !row.branch_code) {
        updated[i] = { ...row, status: 'error', error: 'branch_manager and branch_code are required' };
        setRows([...updated]);
        continue;
      }
      try {
        await createBranch({
          branch_manager: row.branch_manager,
          branch_code: row.branch_code,
          country: row.country,
          address: row.address,
          lat: row.lat,
          lon: row.lon,
          status: true,
        });
        updated[i] = { ...row, status: 'success' };
      } catch (e: any) {
        updated[i] = { ...row, status: 'error', error: e.message ?? 'Failed' };
      }
      setRows([...updated]);
    }

    setImporting(false);
    setDone(true);

    const ok = updated.filter((r) => r.status === 'success').length;
    const failed = updated.length - ok;
    if (failed === 0) {
      feedbackActions.success(`${ok} ${ok === 1 ? 'branch' : 'branches'} created.`);
    } else {
      feedbackActions.error(
        `${ok} of ${updated.length} branches created. ${failed} failed — the Status column says why for each.`,
        'Some rows failed',
      );
    }
  };

  const successCount = rows.filter((r) => r.status === 'success').length;
  const errorCount = rows.filter((r) => r.status === 'error').length;

  // Full-screen like Create Branch, so Escape closes it — but not mid-import
  // (that would hide rows still being created), and not while a message modal
  // on top is taking the key.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || importing || feedbackStore.state.queue.length > 0) return;
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [isOpen, importing, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-branch-title"
      className="fixed inset-0 z-50 flex flex-col bg-white"
    >
      {/* ── Header ── */}
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 px-4 py-4 sm:px-8">
        <div className="min-w-0">
          <h2 id="bulk-branch-title" className="text-xl font-bold text-gray-900 sm:text-2xl">Bulk Import Branches</h2>
          <p className="mt-0.5 text-sm text-gray-500">Fill in the template, upload it, check the preview, then import.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={importing}
          aria-label="Close"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 disabled:opacity-40"
        >
          <i className="ri-close-line text-xl" />
        </button>
      </header>

      {/* ── Body ── */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6 sm:px-8 sm:py-8">
          {/* Template download */}
          <div className="flex items-center justify-between gap-4 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800">Download template</p>
              <p className="text-xs text-gray-400">
                Columns: {TEMPLATE_HEADERS.join(', ')}. lat and lon are optional — you can pin the location later.
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadTemplate(TEMPLATE_HEADERS, 'branch_template.xlsx')}
              className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
            >
              <i className="ri-download-2-line text-base" />
              Template
            </button>
          </div>

          {/* Drop zone */}
          <div
            className={`border-2 border-dashed border-gray-200 rounded-xl text-center cursor-pointer hover:border-gray-400 transition-colors ${rows.length ? 'p-5' : 'p-10'}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            <i className="ri-file-upload-line text-3xl text-gray-300 mb-2 block" />
            <p className="text-sm font-medium text-gray-600">
              {rows.length ? 'Drop another file to replace this one, or ' : 'Drop file here or '}
              <span className="text-brand">browse</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">Accepts .csv and .xlsx</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) handleFile(f); }}
            />
          </div>

          {parseError && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">
              <i className="ri-error-warning-line text-base" />
              {parseError}
            </div>
          )}

          {/* Preview table */}
          {rows.length > 0 && (
            <div>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Preview — {rows.length} row{rows.length !== 1 ? 's' : ''}
                </p>
                {done && (
                  <p className="text-xs text-gray-500">
                    Done: <span className="text-green-600 font-semibold">{successCount} succeeded</span>
                    {errorCount > 0 && <>, <span className="text-red-500 font-semibold">{errorCount} failed</span></>}
                  </p>
                )}
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-semibold">#</th>
                      <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-semibold">Manager</th>
                      <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-semibold">Code</th>
                      <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-semibold">Country</th>
                      <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-semibold">Address</th>
                      <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-semibold">Location</th>
                      <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className={`border-t border-gray-50 align-top ${row.status === 'error' ? 'bg-red-50/40' : ''}`}>
                        <td className="px-4 py-2.5 text-gray-400">{i + 1}</td>
                        <td className="px-4 py-2.5 text-gray-700">{row.branch_manager || '—'}</td>
                        <td className="px-4 py-2.5 text-gray-700 font-mono">{row.branch_code || '—'}</td>
                        <td className="px-4 py-2.5 text-gray-700">{row.country || '—'}</td>
                        <td className="px-4 py-2.5 text-gray-700">{row.address || '—'}</td>
                        <td className="px-4 py-2.5">
                          {row.lat && row.lon ? (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500" title={`${row.lat}, ${row.lon}`}>
                              <i className="ri-map-pin-2-fill text-brand text-sm" />Pinned
                            </span>
                          ) : (
                            <span className="text-gray-300" title="No coordinates provided">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {row.status === 'pending' && (
                            importing ? <i className="ri-loader-4-line animate-spin text-gray-300" /> : <span className="text-gray-400">—</span>
                          )}
                          {row.status === 'success' && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                              <i className="ri-checkbox-circle-line text-sm" />Created
                            </span>
                          )}
                          {row.status === 'error' && (
                            <span className="inline-flex items-start gap-1 text-xs text-red-600">
                              <i className="ri-close-circle-line mt-px text-sm" />
                              <span>{row.error ?? 'Failed'}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="shrink-0 border-t border-gray-100 bg-white px-4 py-3 sm:px-8">
        <div className="mx-auto flex w-full max-w-5xl justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={importing}
            className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-60"
          >
            {done ? 'Close' : 'Cancel'}
          </button>
          {rows.length > 0 && !done && (
            <button
              type="button"
              onClick={handleImport}
              disabled={importing}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {importing && <i className="ri-loader-4-line animate-spin text-base" />}
              {importing ? 'Importing…' : `Import ${rows.length} ${rows.length === 1 ? 'branch' : 'branches'}`}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};
