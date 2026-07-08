import React, { useRef, useState } from 'react';
import { DefaultModal } from './DefaultModal';
import { useGetRoles } from '../../hooks/useRoles';
import { useCreateInvite } from '../../hooks/useInvites';
import { parseSpreadsheet, downloadTemplate } from '../../lib/parseSpreadsheet';

interface BulkInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type RowStatus = 'pending' | 'success' | 'error';

interface PreviewRow {
  email: string;
  first_name: string;
  last_name: string;
  invite_role: string; // role name from file
  resolvedRoleId: string; // mapped ID
  status: RowStatus;
  error?: string;
}

const REQUIRED_HEADERS = ['email', 'first_name', 'last_name', 'invite_role'];
const TEMPLATE_HEADERS = ['email', 'first_name', 'last_name', 'invite_role'];

export const BulkInviteModal: React.FC<BulkInviteModalProps> = ({ isOpen, onClose }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);

  const { data: rolesData = [] } = useGetRoles();
  const { mutateAsync: createInvite } = useCreateInvite();

  const roleMap = Object.fromEntries(
    rolesData.map((r) => [r.name.toLowerCase(), r.id])
  );

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

      const preview: PreviewRow[] = raw.map((r) => {
        const roleName = (r.invite_role ?? '').trim().toLowerCase();
        const resolvedRoleId = roleMap[roleName] ?? '';
        return {
          email: r.email?.trim() ?? '',
          first_name: r.first_name?.trim() ?? '',
          last_name: r.last_name?.trim() ?? '',
          invite_role: r.invite_role?.trim() ?? '',
          resolvedRoleId,
          status: 'pending',
        };
      });
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
      if (!row.email || !row.first_name || !row.last_name || !row.resolvedRoleId) {
        updated[i] = { ...row, status: 'error', error: !row.resolvedRoleId ? 'Role not found' : 'Missing required fields' };
        setRows([...updated]);
        continue;
      }
      try {
        await createInvite({ email: row.email, first_name: row.first_name, last_name: row.last_name, invite_role: row.resolvedRoleId });
        updated[i] = { ...row, status: 'success' };
      } catch (e: any) {
        updated[i] = { ...row, status: 'error', error: e.message ?? 'Failed' };
      }
      setRows([...updated]);
    }

    setImporting(false);
    setDone(true);
  };

  const successCount = rows.filter((r) => r.status === 'success').length;
  const errorCount = rows.filter((r) => r.status === 'error').length;

  return (
    <DefaultModal isOpen={isOpen} onClose={onClose} title="Bulk Invite Users">
      <div className="space-y-4">
        {/* Template download */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-800">Download template</p>
            <p className="text-xs text-gray-400">Fill in the template then upload it below</p>
          </div>
          <button
            type="button"
            onClick={() => downloadTemplate(TEMPLATE_HEADERS, 'invite_template.xlsx')}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#F14724] hover:underline"
          >
            <i className="ri-download-2-line text-base" />
            Template
          </button>
        </div>

        {/* Drop zone */}
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

        {/* Preview table */}
        {rows.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Preview — {rows.length} row{rows.length !== 1 ? 's' : ''}
            </p>
            <div className="rounded-xl border border-gray-100 overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 text-gray-500 font-semibold">Email</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-semibold">Name</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-semibold">Role</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="px-3 py-2 text-gray-700 truncate max-w-[120px]">{row.email}</td>
                      <td className="px-3 py-2 text-gray-700">{row.first_name} {row.last_name}</td>
                      <td className="px-3 py-2">
                        <span className={row.resolvedRoleId ? 'text-gray-700' : 'text-red-500'}>
                          {row.invite_role || '—'}
                          {!row.resolvedRoleId && row.invite_role && ' (not found)'}
                        </span>
                      </td>
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
            onClick={onClose}
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
              {importing ? 'Importing…' : `Import ${rows.length} users`}
            </button>
          )}
        </div>
      </div>
    </DefaultModal>
  );
};
