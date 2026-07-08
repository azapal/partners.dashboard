import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DefaultModal } from './DefaultModal';
import { DefaultTextInput } from '../inputs/DefaultTextInput';
import { DefaultButton } from '../buttons/DefaultButton';
import { SearchableSelect } from '../inputs/SearchableSelect';
import { useGetRoles } from '../../hooks/useRoles';
import { useGetBranches } from '../../hooks/useBranchPartner';

interface AddNewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (user: { email: string; first_name: string; last_name: string; branch?: string; invite_role: string }) => void;
}

export const AddNewUserModal: React.FC<AddNewUserModalProps> = ({ isOpen, onClose, onInvite }) => {
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

  const reset = () => {
    setEmail('');
    setFirstName('');
    setLastName('');
    setSelectedBranch(branchOptions[0]?.value ?? '');
    setSelectedRole(roleOptions[0]?.value ?? '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInvite({
      email,
      first_name: firstName,
      last_name: lastName,
      ...(selectedBranch ? { branch: selectedBranch } : {}),
      invite_role: selectedRole,
    });
    reset();
  };

  return (
    <DefaultModal isOpen={isOpen} onClose={onClose} title="Invite New User">
      <form onSubmit={handleSubmit} className="space-y-4">
        <DefaultTextInput
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter user's email"
          type="email"
          required
        />
        <DefaultTextInput
          label="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Enter first name"
          required
        />
        <DefaultTextInput
          label="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Enter last name"
          required
        />

        {branchesLoading ? (
          <SelectSkeleton label="Branch" />
        ) : branchOptions.length === 0 ? (
          <div className="flex flex-col gap-1">
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

        <div className="flex justify-end gap-2 pt-1">
          <DefaultButton label="Cancel" onClick={onClose} variant="secondary" />
          <DefaultButton
            label="Send Invite"
            type="submit"
            disabled={!selectedRole || rolesLoading || branchesLoading}
          />
        </div>
      </form>
    </DefaultModal>
  );
};

function SelectSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="h-11.25 rounded-xl bg-gray-100 animate-pulse" />
    </div>
  );
}
