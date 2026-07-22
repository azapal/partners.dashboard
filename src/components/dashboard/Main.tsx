import { sheetActions } from "../../store/client/sheets";
import { useResizeObserver } from "../../hooks/useResizeObserver";
import { AddNewBranch } from "../modal/AddNewBranch";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetDashboardStats } from "../../hooks/useDashboard";
import { useGetTransactions } from "../../hooks/useTransactions";
import { useGetPartnerServices } from "../../hooks/useServices";
import type { DashboardBranch, Transaction } from "../../service/partnerService";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

const orders = [
    { amount: 6000, business_name: "Business Name", buyer_name: "Buyer Name", assigned_dispatch: "Assigned Dispatch" },
    { amount: 6000, business_name: "Business Name", buyer_name: "Buyer Name", assigned_dispatch: "Assigned Dispatch" },
    { amount: 6000, business_name: "Business Name", buyer_name: "Buyer Name", assigned_dispatch: "Assigned Dispatch" },
    { amount: 6000, business_name: "Business Name", buyer_name: "Buyer Name", assigned_dispatch: "Assigned Dispatch" },
    { amount: 6000, business_name: "Business Name", buyer_name: "Buyer Name", assigned_dispatch: "Assigned Dispatch" },
    { amount: 6000, business_name: "Business Name", buyer_name: "Buyer Name", assigned_dispatch: "Assigned Dispatch" },
    { amount: 6000, business_name: "Business Name", buyer_name: "Buyer Name", assigned_dispatch: "Assigned Dispatch" },
];

const productModules = [
    {
        code: "azapal-tms-fms",
        name: "Azapal TMS/FMS",
        fullName: "Transport/Fleet Management System",
        description: "Plan routes, dispatch fleets, and track deliveries in real time.",
        icon: "ri-truck-line",
        iconBg: "bg-blue-50",
        iconColor: "text-blue-500",
    },
    {
        code: "azapal-ims",
        name: "Azapal IMS",
        fullName: "Inventory Management System",
        description: "Track stock levels, warehouse movement, and reorder points.",
        icon: "ri-archive-2-line",
        iconBg: "bg-purple-50",
        iconColor: "text-purple-500",
    },
];

const awsUsage = [
    { label: "EC2", value: 420 },
    { label: "S3", value: 180 },
    { label: "RDS", value: 260 },
    { label: "Lambda", value: 90 },
    { label: "CloudFront", value: 140 },
];

const awsCostSummary = {
    currentCost: 742.35,
    estimatedMonthCost: 1090.5,
};

function formatRelativeTime(iso: string): string {
    const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diffSec < 60) return "just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 30) return `${diffDay}d ago`;
    return `${Math.floor(diffDay / 30)}mo ago`;
}

const SectionCard = ({ icon, iconColor, iconBg, title, children, className = "" }: any) => (
    <div className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm transition-shadow hover:shadow-md ${className}`}>
        <div className="flex items-center gap-3 mb-4">
            <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                <i className={`${icon} text-lg ${iconColor}`} />
            </div>
            <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
        </div>
        {children}
    </div>
);


function Main() {
    const { containerRef, useResizer } = useResizeObserver();
    const [showAddBranch, setShowAddBranch] = useState(false);
    const [moduleSearch, setModuleSearch] = useState("");
    const [requestedModules, setRequestedModules] = useState<string[]>([]);
    const navigate = useNavigate();

    const filteredModules = productModules.filter((m) =>
        `${m.name} ${m.fullName} ${m.description}`.toLowerCase().includes(moduleSearch.trim().toLowerCase())
    );

    const requestModule = (code: string) =>
        setRequestedModules((prev) => (prev.includes(code) ? prev : [...prev, code]));

    const { data: dashboardStats, isLoading: statsLoading } = useGetDashboardStats();
    const { data: pendingTransactions, isLoading: activityLoading } = useGetTransactions({
        status: "pending",
        page_size: 10,
    });
    const { data: partnerServices, isLoading: coverageLoading } = useGetPartnerServices();

    const orderStats = dashboardStats?.orders;
    const formatAmount = (n?: number) => (statsLoading || n === undefined ? "—" : n.toLocaleString());

    const statsConfig = [
        { icon: "ri-file-add-line", title: "Total Delivery Requests", amount: formatAmount(orderStats?.total), iconBg: "bg-blue-50", iconColor: "text-blue-500" },
        { icon: "ri-close-circle-line", title: "Failed Deliveries", amount: formatAmount(orderStats?.failed), iconBg: "bg-red-50", iconColor: "text-red-500" },
        { icon: "ri-time-line", title: "Pending Deliveries", amount: formatAmount(orderStats?.pending), iconBg: "bg-yellow-50", iconColor: "text-yellow-500" },
        { icon: "ri-folder-check-line", title: "Completed Deliveries", amount: formatAmount(orderStats?.completed), iconBg: "bg-green-50", iconColor: "text-green-500" },
        { icon: "ri-contacts-line", title: "Total Customers", amount: formatAmount(orderStats?.total_customers), iconBg: "bg-purple-50", iconColor: "text-purple-500" },
    ];

    const deliveryBreakdown = [
        { label: "Total", value: orderStats?.total ?? 0, color: "text-gray-900" },
        { label: "Completed", value: orderStats?.completed ?? 0, color: "text-green-600" },
        { label: "Pending", value: orderStats?.pending ?? 0, color: "text-yellow-600" },
        { label: "Failed", value: orderStats?.failed ?? 0, color: "text-red-500" },
    ];

    const branchStats = dashboardStats?.branches;

    const BranchesTable = () => (
        <div className="flex flex-col gap-4">
            <SectionCard
                icon="ri-node-tree"
                iconColor="text-gray-600"
                iconBg="bg-gray-100"
                title={`Branches${branchStats ? ` (${branchStats.total})` : ""}`}
            >
                <div className="relative">
                    <button
                        onClick={() => setShowAddBranch(true)}
                        className="absolute right-0 -top-[52px] flex items-center gap-1.5 bg-gray-900 text-white px-4 py-1.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-gray-700 transition-colors"
                    >
                        <i className="ri-add-line text-sm" />
                        <span className="hidden md:inline">Add Branch</span>
                    </button>
                    <div className="flex flex-col gap-1">
                        {statsLoading ? (
                            [1, 2, 3].map((i) => (
                                <div key={i} className="h-10 rounded-lg bg-gray-50 animate-pulse" />
                            ))
                        ) : branchStats && branchStats.first_three.length > 0 ? (
                            branchStats.first_three.map((branch: DashboardBranch) => (
                                <BranchRow key={branch.id} title={branch.state || branch.address} code={branch.branch_code} />
                            ))
                        ) : (
                            <p className="text-xs text-gray-400 py-2">No branches yet.</p>
                        )}
                    </div>
                </div>
            </SectionCard>

            <SectionCard icon="ri-box-3-line" iconColor="text-teal-600" iconBg="bg-teal-50" title="Service Coverage">
                <div className="flex flex-col gap-2">
                    {coverageLoading ? (
                        [1, 2, 3].map((i) => (
                            <div key={i} className="h-8 rounded-lg bg-gray-50 animate-pulse" />
                        ))
                    ) : partnerServices && partnerServices.length > 0 ? (
                        partnerServices.map((service) => (
                            <div key={service.id} className="flex justify-between items-center py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                                <span className="text-gray-700 text-xs font-medium truncate">{service.name}</span>
                                <span
                                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 ml-2 ${service.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                                        }`}
                                >
                                    {service.is_active ? "Active" : "Inactive"}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-gray-400 py-2">No service coverage</p>
                    )}
                </div>
            </SectionCard>
            <SectionCard icon="ri-apps-2-line" iconColor="text-indigo-500" iconBg="bg-indigo-50" title="Product Modules" className="w-full">
                <div className="relative mb-4 gap-1">
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                    <input
                        type="text"
                        value={moduleSearch}
                        onChange={(e) => setModuleSearch(e.target.value)}
                        placeholder="Search product modules…"
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    {filteredModules.length === 0 ? (
                        <p className="text-xs text-gray-400 py-2">No modules match your search.</p>
                    ) : (
                        filteredModules.map((mod) => (
                            <div
                                key={mod.code}
                                className="flex  flex-col gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                            >
                                <div className={`w-10 h-10 rounded-xl ${mod.iconBg} flex items-center justify-center shrink-0`}>
                                    <i className={`${mod.icon} text-lg ${mod.iconColor}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm">{mod.name}</p>
                                    <p className="text-xs text-gray-400">{mod.fullName}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{mod.description}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => requestModule(mod.code)}
                                    disabled={requestedModules.includes(mod.code)}
                                    className="shrink-0 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:bg-green-50 disabled:text-green-700 disabled:border-green-100 transition-colors"
                                >
                                    {requestedModules.includes(mod.code) ? "Subscribed" : "Subscribe"}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </SectionCard>
        </div>
    );

    return (
        <>
            <main className="w-full flex flex-col gap-6 overflow-y-auto">
                {/* Stats Row */}
                <div ref={containerRef} className={`grid gap-3 ${useResizer ? "grid-cols-5" : "grid-cols-2"}`}>
                    {statsConfig.map((stat) => (
                        <StatsCard key={stat.title} {...stat} />
                    ))}
                </div>

                {/* Main content grid */}
                <div className="flex w-full gap-4 flex-col md:flex-row">
                    {/* Left column */}
                    <div className="flex flex-col w-full gap-4">
                        <SectionCard icon="ri-line-chart-line" iconColor="text-[#F14724]" iconBg="bg-orange-50" title="Recent Activity">
                            <div className="flex flex-col">
                                {activityLoading ? (
                                    [...Array(6)].map((_, i) => (
                                        <div key={i} className="h-12 rounded-lg bg-gray-50 animate-pulse my-1" />
                                    ))
                                ) : pendingTransactions && pendingTransactions.results.length > 0 ? (
                                    pendingTransactions.results.map((tx: Transaction) => (
                                        <Activity
                                            key={tx.id}
                                            title={`Order #${tx.id}`}
                                            id={`${tx.total_amount != null ? `₦${tx.total_amount.toLocaleString()}` : "Pending price"} · ${tx.delivery_method?.replace(/_/g, " ")}`}
                                            time={formatRelativeTime(tx.created_at)}
                                        />
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400 py-2">No pending activity</p>
                                )}
                            </div>
                        </SectionCard>

                        <SectionCard icon="ri-bar-chart-2-line" iconColor="text-blue-500" iconBg="bg-blue-50" title="Delivery Overview">
                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={() => navigate("/dashboard/performance")}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-[#F14724] hover:text-[#d63d1e] transition-colors"
                                >
                                    View Monthly Performance
                                    <i className="ri-arrow-right-line text-sm" />
                                </button>
                            </div>

                            {/* Live stats */}
                            <div className="flex flex-col gap-2 mb-6">
                                {deliveryBreakdown.map((stat, idx) => (
                                    <div key={stat.label} className={`flex justify-between items-center py-2 ${idx < deliveryBreakdown.length - 1 ? "border-b border-gray-50" : ""}`}>
                                        <span className="text-gray-500 text-xs">{stat.label}</span>
                                        <span className={`font-bold text-sm ${stat.color}`}>
                                            {statsLoading ? "—" : stat.value.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Delivery bar chart */}
                            <p className="text-xs font-semibold text-gray-500 mb-2">Delivery Breakdown</p>
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={deliveryBreakdown} barSize={28}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                                            cursor={{ fill: "rgba(241,71,36,0.05)" }}
                                        />
                                        <Bar dataKey="value" fill="#F14724" radius={[6, 6, 0, 0]} animationBegin={100} animationDuration={700} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </SectionCard>
                        <SectionCard icon="ri-cloud-line" iconColor="text-orange-500" iconBg="bg-orange-50" title="Cloud Operations (AWS)" className="w-full">
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-[11px] text-gray-400 font-medium">Current Cost</p>
                                    <p className="text-lg font-bold text-gray-900">${awsCostSummary.currentCost.toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-[11px] text-gray-400 font-medium">Est. Month Cost</p>
                                    <p className="text-lg font-bold text-gray-900">${awsCostSummary.estimatedMonthCost.toLocaleString()}</p>
                                </div>
                            </div>
                            <p className="text-xs font-semibold text-gray-500 mb-2">Resource Usage Cost ($)</p>
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={awsUsage} barSize={28}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                                            cursor={{ fill: "rgba(249,115,22,0.05)" }}
                                            formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Cost"]}
                                        />
                                        <Bar dataKey="value" fill="#f97316" radius={[6, 6, 0, 0]} animationBegin={100} animationDuration={700} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </SectionCard>
                    </div>

                    {/* Right column */}
                    <div className="flex flex-col w-full md:max-w-xs gap-4">
                        <BranchesTable />
                    </div>
                </div>


            </main>

            {showAddBranch && <AddNewBranch setShowAddBranch={setShowAddBranch} />}
        </>
    );
}

export default Main;

/* ---------- Branch Row ---------- */
function BranchRow({ title, code }: { title: string; code: string }) {
    return (
        <div className="flex items-center justify-between gap-2 py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <i className="ri-map-pin-2-line text-gray-500 text-xs" />
                </div>
                <span className="text-xs font-medium text-gray-700 truncate">{title}</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono hidden sm:inline shrink-0">{code}</span>
        </div>
    );
}

/* ---------- StatsCard ---------- */
interface StatsCardProps {
    title?: string;
    amount?: string;
    icon?: string;
    iconBg?: string;
    iconColor?: string;
    trend?: string;
}

function StatsCard({ amount, title, icon, iconBg, iconColor, trend }: StatsCardProps) {
    function handleToggle(value: string) {
        sheetActions.toggleBasicResizableSheet({
            name: "deliveriesModal",
            show: true,
            props: { orderData: orders, title: value },
        });
    }

    const isPositive = trend?.startsWith("+");

    return (
        <div
            onClick={() => handleToggle(title!)}
            className="flex flex-col gap-3 cursor-pointer bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
        >
            <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
                <i className={`${icon} text-lg ${iconColor}`} />
            </div>
            <div>
                <p className="text-[11px] font-medium text-gray-400 leading-tight mb-0.5">{title}</p>
                <h3 className="font-bold text-xl text-gray-900">{amount}</h3>
            </div>
            {trend && (
                <span className={`text-[11px] font-semibold ${isPositive ? "text-green-600" : "text-red-500"}`}>
                    {trend} this month
                </span>
            )}
        </div>
    );
}

/* ---------- Activity ---------- */
interface ActivityProps {
    icon?: string;
    title?: string;
    id?: string;
    time?: string;
}

function Activity({ title, id, time }: ActivityProps) {
    return (
        <div className="flex items-center justify-between gap-3 py-2.5 px-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <i className="ri-package-line text-[#F14724] text-sm" />
                </div>
                <div>
                    <p className="font-medium text-xs text-gray-800">{title}</p>
                    <p className="text-[11px] text-gray-400">{id}</p>
                </div>
            </div>
            {time && <p className="text-[11px] text-gray-400 flex-shrink-0">{time}</p>}
        </div>
    );
}
