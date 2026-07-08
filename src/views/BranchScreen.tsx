import { useMemo, useState } from "react";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { useGetBranches, useUpdateBranch, useDeleteBranch } from "../hooks/useBranchPartner";
import type { BranchPartner, BranchManager } from "../service/partnerService";
import { BulkBranchImportModal } from "../components/modal/BulkBranchImportModal";
import { CreateBranchDrawer } from "../components/modal/CreateBranchDrawer";
import { sheetActions } from "../store/client/sheets";

type BranchStatus = "Active" | "Inactive";

export interface BranchDetail {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  lat: string;
  lon: string;
  branch_managers: BranchManager[];
  phone: string;
  status: BranchStatus;
}

function mapBranch(bp: BranchPartner): BranchDetail {
  return {
    id: bp.id,
    name: bp.branch_code,
    code: bp.branch_code,
    city: bp.address,
    state: bp.country,
    lat: bp.lat ?? "",
    lon: bp.lon ?? "",
    branch_managers: bp.branch_managers,
    phone: "",
    status: bp.status ? "Active" : "Inactive",
  };
}

export const BranchScreen = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | BranchStatus>("All");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  const { data: apiData = [], isLoading } = useGetBranches();
  const { mutate: updateBranch } = useUpdateBranch();
  const { mutate: deleteBranch } = useDeleteBranch();

  const branches: BranchDetail[] = apiData.map(mapBranch);

  const filteredBranches = useMemo(() => {
    const query = search.trim().toLowerCase();
    return branches.filter((branch) => {
      const managerNames = branch.branch_managers
        .map((m) => `${m.first_name} ${m.last_name}`)
        .join(" ");
      const matchesSearch =
        !query ||
        [branch.name, branch.code, branch.city, branch.state, managerNames]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesStatus = statusFilter === "All" || branch.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [branches, search, statusFilter]);

  const branchTotals = useMemo(
    () => ({
      total: branches.length,
      active: branches.filter((b) => b.status === "Active").length,
      inactive: branches.filter((b) => b.status === "Inactive").length,
    }),
    [branches]
  );

  const closeSheet = () =>
    sheetActions.toggleBasicResizableSheet({ name: null, show: false, props: null });

  const openDetail = (branch: BranchDetail) => {
    sheetActions.toggleBasicResizableSheet({
      name: "branchDetailSheet",
      show: true,
      props: {
        branch,
        onSave: (id: string, data: { status: BranchStatus; address: string; lat: string; lon: string; managerIds: string[] }) => {
          updateBranch(
            {
              id,
              payload: {
                branch_managers: data.managerIds,
                address: data.address,
                lat: data.lat,
                lon: data.lon,
                status: data.status === "Active",
              },
            },
            { onSuccess: closeSheet }
          );
        },
        onDelete: (id: string) => {
          deleteBranch(id, { onSuccess: closeSheet });
        },
      },
    });
  };

  return (
    <DashboardLayout>
      <div className="w-full flex flex-col gap-5 overflow-y-auto">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search branches…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <div className="flex items-center gap-1">
              {(["All", "Active", "Inactive"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`h-9 px-3 rounded-xl text-sm font-medium border transition ${
                    statusFilter === s
                      ? "border-[#F14724] bg-orange-50 text-[#F14724]"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50 bg-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsBulkOpen(true)}
              className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              <i className="ri-file-upload-line text-base" />
              Bulk Import
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-[#F14724] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#d63d1e] transition-colors"
            >
              <i className="ri-add-line text-base" />
              Create Branch
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(
            [
              { label: "Total Branches", value: branchTotals.total, icon: "ri-git-branch-line", color: "text-blue-500", bg: "bg-blue-50" },
              { label: "Active", value: branchTotals.active, icon: "ri-checkbox-circle-line", color: "text-green-600", bg: "bg-green-50" },
              { label: "Inactive", value: branchTotals.inactive, icon: "ri-forbid-line", color: "text-orange-500", bg: "bg-orange-50" },
            ] as const
          ).map(({ label, value, icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <i className={`${icon} text-lg ${color}`} />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-medium">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-orange-50/60">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Branch</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Managers</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-14 text-gray-400 text-sm">
                      <i className="ri-loader-4-line animate-spin text-xl" />
                    </td>
                  </tr>
                ) : filteredBranches.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-14 text-gray-400 text-sm">
                      No branches found
                    </td>
                  </tr>
                ) : (
                  filteredBranches.map((branch) => (
                    <tr
                      key={branch.id}
                      onClick={() => openDetail(branch)}
                      className="border-b border-gray-50 hover:bg-orange-50/40 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                            <i className="ri-git-branch-line text-base text-[#F14724]" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{branch.name}</p>
                            <p className="text-xs text-gray-400">{branch.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 text-sm">
                        {branch.city}, {branch.state}
                      </td>
                      <td className="px-4 py-3.5">
                        {branch.branch_managers.length === 0 ? (
                          <span className="text-xs text-gray-400">None</span>
                        ) : (
                          <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                            {branch.branch_managers.length} manager{branch.branch_managers.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            branch.status === "Active"
                              ? "bg-green-50 text-green-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {branch.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-gray-50">
            {isLoading ? (
              <p className="text-center py-14 text-gray-400 text-sm">
                <i className="ri-loader-4-line animate-spin text-xl" />
              </p>
            ) : filteredBranches.length === 0 ? (
              <p className="text-center py-14 text-gray-400 text-sm">No branches found</p>
            ) : (
              filteredBranches.map((branch) => (
                <div
                  key={branch.id}
                  onClick={() => openDetail(branch)}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-orange-50/40 cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                    <i className="ri-git-branch-line text-lg text-[#F14724]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{branch.name}</p>
                    <p className="text-xs text-gray-400 truncate">{branch.city}, {branch.state}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {branch.branch_managers.length} manager{branch.branch_managers.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      branch.status === "Active"
                        ? "bg-green-50 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {branch.status}
                  </span>
                </div>
              ))
            )}
          </div>

          {filteredBranches.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-50">
              <p className="text-xs text-gray-400">
                Showing {filteredBranches.length} of {branches.length} branches
              </p>
            </div>
          )}
        </div>
      </div>

      {showCreateForm && <CreateBranchDrawer onClose={() => setShowCreateForm(false)} />}
      <BulkBranchImportModal isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} />
    </DashboardLayout>
  );
};
