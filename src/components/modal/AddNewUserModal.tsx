import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DefaultModal } from './DefaultModal';
import { SearchableSelect } from '../inputs/SearchableSelect';
import { useGetRoles } from '../../hooks/useRoles';
import { useGetBranches } from '../../hooks/useBranchPartner';

interface AddNewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (user: { email: string; first_name: string; last_name: string; branch?: string; invite_role: string }) => void;
  error?: string | null;
  isSubmitting?: boolean;
}

export const AddNewUserModal: React.FC<AddNewUserModalProps> = ({ isOpen, onClose, onInvite, error, isSubmitting }) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const { data: rolesData = [], isLoading: rolesLoading } = useGetRoles();
  const { data: branchesData = [], isLoading: branchesLoading } = useGetBranches();

  const roleOptions = rolesData.map((r) => ({ label: r.name, value: r.id }));
  const branchOptions = branchesData.map((b) => ({ label: b.branch_code, value: b.id }));

  // Auto-select first option once data loads and nothing is selected yet
  useEffect(() => {
    if (roleOptions.length > 0 && !selectedRole) {
      setSelectedRole(roleOptions[0].value);
    }
  }, [roleOptions]);

  // Branch is optional — no auto-select default

  // Start each fresh open with blank fields. On a failed submit the modal
  // stays open (isOpen doesn't toggle), so typed values are preserved
  // instead of being wiped out before we know whether the invite worked.
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setFirstName('');
      setLastName('');
      setSelectedBranch('');
      setSelectedRole('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    onInvite({
      email,
      first_name: firstName,
      last_name: lastName,
      ...(selectedBranch ? { branch: selectedBranch } : {}),
      invite_role: selectedRole,
    });
  };

  return (
    <DefaultModal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite New User"
      subtitle="Send a team member an invite to join your portal."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">
            <i className="ri-error-warning-line text-base shrink-0" />
            {error}
          </div>
        )}

        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="user@example.com"
          icon="ri-mail-line"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Field label="First Name" value={firstName} onChange={setFirstName} placeholder="First name" required />
          <Field label="Last Name" value={lastName} onChange={setLastName} placeholder="Last name" required />
        </div>

        {branchesLoading ? (
          <SelectSkeleton label="Branch" />
        ) : branchOptions.length === 0 ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-700">Branch</span>
            <div className="flex items-center justify-between h-11 px-3 rounded-xl border border-gray-200 bg-gray-50">
              <span className="text-sm text-gray-400">No branches yet</span>
              <Link
                to="/branches"
                className="flex items-center gap-1 text-xs font-semibold text-[#F14724] hover:underline"
              >
                <i className="ri-add-line text-sm" />
                Create branch
              </Link>
            </div>
          </div>
        ) : (
          <SearchableSelect
            label="Branch"
            options={branchOptions}
            value={selectedBranch}
            onChange={setSelectedBranch}
            placeholder="Search branch…"
          />
        )}

        {rolesLoading ? (
          <SelectSkeleton label="Role" />
        ) : (
          <SearchableSelect
            label="Role"
            options={roleOptions}
            value={selectedRole}
            onChange={setSelectedRole}
            placeholder="Search role…"
          />
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 mt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !selectedRole || rolesLoading || branchesLoading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#F14724] hover:bg-[#d63d1e] rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting && <i className="ri-loader-4-line animate-spin text-base" />}
            {isSubmitting ? 'Sending…' : 'Send Invite'}
          </button>
        </div>
      </form>
    </DefaultModal>
  );
};

function Field({ label, value, onChange, placeholder, required, type = 'text', icon }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; type?: string; icon?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {icon && <i className={`${icon} absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base`} />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`h-11 ${icon ? 'pl-9' : 'px-3'} pr-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white w-full`}
        />
      </div>
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
