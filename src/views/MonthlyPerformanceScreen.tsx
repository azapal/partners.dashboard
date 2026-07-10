import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { DashboardLayout } from "../layouts/DashboardLayout";

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

function MonthlyPerformanceScreen() {
    const navigate = useNavigate();
    const [selectedMonth, setSelectedMonth] = useState("October");
    const [selectedYear, setSelectedYear] = useState(2025);

    const key = `${selectedYear}-${String(months.indexOf(selectedMonth) + 1).padStart(2, "0")}`;
    const performanceStats = performanceData[key] || [];

    return (
        <DashboardLayout>
            <div className="w-full flex flex-col gap-5">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-9 h-9 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
                    >
                        <i className="ri-arrow-left-line text-lg text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Monthly Performance</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Browse delivery and revenue performance by month.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
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
                            {performanceStats.length === 0 ? (
                                <p className="text-xs text-gray-400 py-2">No data for this period.</p>
                            ) : (
                                performanceStats.map((stat: any, idx: number) => (
                                    <div key={idx} className={`flex justify-between items-center py-2 ${idx < performanceStats.length - 1 ? "border-b border-gray-50" : ""}`}>
                                        <span className="text-gray-500 text-xs">{stat.label}</span>
                                        <span className={`font-bold text-sm ${stat.color}`}>{Number(stat.value).toLocaleString()}</span>
                                    </div>
                                ))
                            )}
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
                </div>
            </div>
        </DashboardLayout>
    );
}

export default MonthlyPerformanceScreen;
