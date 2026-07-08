import { sheetActions } from "../../store/client/sheets";
import { useResizeObserver } from "../../hooks/useResizeObserver";
import { AddNewBranch } from "../modal/AddNewBranch";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const years = [2023, 2024, 2025];

const performanceData: any = {
    "2025-10": [
        { label: "Total Deliveries", value: "2847", color: "text-gray-900" },
        { label: "Completed", value: "2791", color: "text-green-600" },
        { label: "Pending", value: "42", color: "text-yellow-600" },
        { label: "Cancelled", value: "14", color: "text-red-500" },
    ],
    "2025-09": [
        { label: "Total Deliveries", value: "12847", color: "text-gray-900" },
        { label: "Completed", value: "8791", color: "text-green-600" },
        { label: "Pending", value: "442", color: "text-yellow-600" },
        { label: "Cancelled", value: "414", color: "text-red-500" },
    ],
};

const financialPerformanceData = [
    { label: "Sep '25", value: "11000", color: "text-gray-900" },
    { label: "Oct '25", value: "131000", color: "text-gray-900" },
];

const serviceCoverage = [
    { location: "Lagos", status: "Active", color: "green" },
    { location: "Abuja FCT", status: "Active", color: "green" },
    { location: "Port Harcourt", status: "Active", color: "green" },
    { location: "Ibadan", status: "Inactive", color: "red" },
];

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

const statsConfig = [
    { icon: "ri-file-add-line", title: "Total Delivery Requests", amount: "1,250", iconBg: "bg-blue-50", iconColor: "text-blue-500", trend: "+12%" },
    { icon: "ri-close-circle-line", title: "Failed Deliveries", amount: "5", iconBg: "bg-red-50", iconColor: "text-red-500", trend: "-2%" },
    { icon: "ri-time-line", title: "Pending Deliveries", amount: "10", iconBg: "bg-yellow-50", iconColor: "text-yellow-500", trend: "+3%" },
    { icon: "ri-folder-check-line", title: "Completed Deliveries", amount: "900", iconBg: "bg-green-50", iconColor: "text-green-500", trend: "+8%" },
    { icon: "ri-contacts-line", title: "Total Customers", amount: "900", iconBg: "bg-purple-50", iconColor: "text-purple-500", trend: "+5%" },
];

function Main() {
    const { containerRef, useResizer } = useResizeObserver();
    const [showAddBranch, setShowAddBranch] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState("October");
    const [selectedYear, setSelectedYear] = useState(2025);

    const key = `${selectedYear}-${String(months.indexOf(selectedMonth) + 1).padStart(2, "0")}`;
    const performanceStats = performanceData[key] || [];

    const BranchesTable = () => (
        <div className="flex flex-col gap-4">
            <SectionCard icon="ri-node-tree" iconColor="text-gray-600" iconBg="bg-gray-100" title="Branches Per State">
                <div className="relative">
                    <button
                        onClick={() => setShowAddBranch(true)}
                        className="absolute right-0 -top-[52px] flex items-center gap-1.5 bg-gray-900 text-white px-4 py-1.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-gray-700 transition-colors"
                    >
                        <i className="ri-add-line text-sm" />
                        <span className="hidden md:inline">Add Branch</span>
                    </button>
                    <div className="flex flex-col gap-1">
                        <BranchRow title="Lagos" code="Lagos-A4T" />
                        <BranchRow title="Port Harcourt" code="Portharcourt-AWW" />
                        <BranchRow title="Abuja" code="Abuja-20W" />
                    </div>
                </div>
            </SectionCard>

            <SectionCard icon="ri-box-3-line" iconColor="text-teal-600" iconBg="bg-teal-50" title="Service Coverage">
                <div className="flex flex-col gap-2">
                    {serviceCoverage.map((service, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                            <span className="text-gray-700 text-xs font-medium">{service.location}</span>
                            <span
                                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full
                                    ${service.color === "green" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}
                            >
                                {service.status}
                            </span>
                        </div>
                    ))}
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
                                {[...Array(6)].map((_, i) => (
                                    <Activity key={i} icon="/icons/order.svg" title="New order received" id="Order #3922090" time="2h ago" />
                                ))}
                            </div>
                        </SectionCard>

                        <SectionCard icon="ri-bar-chart-2-line" iconColor="text-blue-500" iconBg="bg-blue-50" title="Monthly Performance">
                            {/* Controls */}
                            <div className="flex gap-2 mb-4">
                                <select
                                    className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                >
                                    {months.map((m) => <option key={m}>{m}</option>)}
                                </select>
                                <select
                                    className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                >
                                    {years.map((y) => <option key={y}>{y}</option>)}
                                </select>
                            </div>

                            {/* Animated stats */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={key}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.25 }}
                                    className="flex flex-col gap-2 mb-6"
                                >
                                    {performanceStats.map((stat: any, idx: number) => (
                                        <div key={idx} className={`flex justify-between items-center py-2 ${idx < performanceStats.length - 1 ? "border-b border-gray-50" : ""}`}>
                                            <span className="text-gray-500 text-xs">{stat.label}</span>
                                            <span className={`font-bold text-sm ${stat.color}`}>{Number(stat.value).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </motion.div>
                            </AnimatePresence>

                            {/* Delivery bar chart */}
                            <p className="text-xs font-semibold text-gray-500 mb-2">Delivery Breakdown</p>
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={performanceStats} barSize={28}>
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

                            {/* Financial bar chart */}
                            <p className="text-xs font-semibold text-gray-500 mt-6 mb-2">Revenue (₦)</p>
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={financialPerformanceData} barSize={28}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                                            cursor={{ fill: "rgba(241,71,36,0.05)" }}
                                            formatter={(v: any) => [`₦${Number(v).toLocaleString()}`, "Revenue"]}
                                        />
                                        <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} animationBegin={100} animationDuration={700} />
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
        <div className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                    <i className="ri-map-pin-2-line text-gray-500 text-xs" />
                </div>
                <span className="text-xs font-medium text-gray-700">{title}</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">{code}</span>
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
