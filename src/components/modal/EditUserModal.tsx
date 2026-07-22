import React, { useEffect, useState } from 'react';
import { DefaultModal } from './DefaultModal';
import { SearchableSelect } from '../inputs/SearchableSelect';
import type { User } from '../../views/UserManagementScreen';
import { useGetRoles } from '../../hooks/useRoles';
import { useGetBranches } from '../../hooks/useBranchPartner';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<User>) => void;
  user: User | null;
  error?: string | null;
  isSubmitting?: boolean;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, onUpdate, user, error, isSubmitting }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [branch, setBranch] = useState('');
  const [role, setRole] = useState('');

  const { data: rolesData = [], isLoading: rolesLoading } = useGetRoles();
  const { data: branchesData = [], isLoading: branchesLoading } = useGetBranches();

  const roleOptions = rolesData.map((r) => ({ label: r.name, value: r.id }));
  const branchOptions = branchesData.map((b) => ({ label: b.branch_code, value: b.id }));

  // Populate form when user changes
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name);
      setLastName(user.last_name);
      setPhone(user.phone ?? '');
      setBranch(user.branch);
      setRole(user.invite_role);
    }
  }, [user]);

  // Match by label (branch_code / role name) since User stores display strings, not IDs
  useEffect(() => {
    if (user && branchOptions.length > 0) {
      const matched = branchOptions.find((o) => o.label === user.branch);
      setBranch(matched?.value ?? '');
    }
  }, [user, branchOptions.length]);

  useEffect(() => {
    if (user && roleOptions.length > 0) {
      const matched = roleOptions.find((o) => o.label === user.invite_role);
      setRole(matched?.value ?? roleOptions[0]?.value ?? '');
    }
  }, [user, roleOptions.length]);

  if (!user) return null;

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    onUpdate(user.id, { first_name: firstName, last_name: lastName, phone, branch, invite_role: role });
  };

  return (
    <DefaultModal isOpen={isOpen} onClose={onClose} title={`Edit ${user.first_name} ${user.last_name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">
            <i className="ri-error-warning-line text-base shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="First Name" value={firstName} onChange={setFirstName} placeholder="First name" required />
          <Field label="Last Name" value={lastName} onChange={setLastName} placeholder="Last name" required />
        </div>

        <Field label="Phone" value={phone} onChange={setPhone} placeholder="+234 800 000 0000" />

        {branchesLoading ? (
          <SelectSkeleton label="Branch" />
        ) : (
          <SearchableSelect
            label="Branch"
            options={branchOptions}
            value={branch}
            onChange={setBranch}
            placeholder="Search branch…"
          />
        )}

        {rolesLoading ? (
          <SelectSkeleton label="Role" />
        ) : (
          <SearchableSelect
            label="Role"
            options={roleOptions}
            value={role}
            onChange={setRole}
            placeholder="Search role…"
          />
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#F14724] hover:bg-[#d63d1e] rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting && <i className="ri-loader-4-line animate-spin text-base" />}
            {isSubmitting ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </DefaultModal>
  );
};

function Field({ label, value, onChange, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white"
      />
    </div>
  );
}

function SelectSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="h-11.25 rounded-xl bg-gray-100 animate-pulse" />
    </div>
  );
}
