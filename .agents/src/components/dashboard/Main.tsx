import {sheetActions, } from "../../store/client/sheets";
import {useResizeObserver} from "../../hooks/useResizeObserver";
import {DefaultButton} from "../buttons/DefaultButton";
import {AddNewBranch} from "../modal/AddNewBranch";
import React, {useState} from "react";
import {Package, TrendingUp, Network} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts"

const orders = [
    {
        amount:6000,
        business_name: "Business Name",
        buyer_name: "Buyer Name",
        assigned_dispatch: "Assigned Dispatch",

    },{
        amount:6000,
        business_name: "Business Name",
        buyer_name: "Buyer Name",
        assigned_dispatch: "Assigned Dispatch",
    },{
        amount:6000,
        business_name: "Business Name",
        buyer_name: "Buyer Name",
        assigned_dispatch: "Assigned Dispatch",
    },{
        amount:6000,
        business_name: "Business Name",
        buyer_name: "Buyer Name",
        assigned_dispatch: "Assigned Dispatch",
    },{
        amount:6000,
        business_name: "Business Name",
        buyer_name: "Buyer Name",
        assigned_dispatch: "Assigned Dispatch",
    },{
        amount:6000,
        business_name: "Business Name",
        buyer_name: "Buyer Name",
        assigned_dispatch: "Assigned Dispatch",
    },{
        amount:6000,
        business_name: "Business Name",
        buyer_name: "Buyer Name",
        assigned_dispatch: "Assigned Dispatch",
    },
]

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const years = [2023, 2024, 2025];


const performanceData:any = {
    "2025-10": [
        {label: "Total Deliveries", value: "2847",  color: "text-gray-900"},
        {label: "Completed", value: "2791", color: "text-green-600"},
        {label: "Pending", value: "42", color: "text-yellow-600"},
        {label: "Cancelled", value: "14", color: "text-red-600"}
    ],
    "2025-09": [
        {label: "Total Deliveries", value: "12847", color: "text-gray-900"},
        {label: "Completed", value: "8791", color: "text-green-600"},
        {label: "Pending", value: "442",  color: "text-yellow-600"},
        {label: "Cancelled", value: "414",  color: "text-red-600"}
    ]
};

const financialPerformanceData = [
        {label: "2025-09",  value:"11000", color: "text-gray-900"},
        {label: "2025-10",  value:"131000", color: "text-gray-900"},
];

const serviceCoverage = [
    { location: "Lagos", status: "Active", color: "green" },
    { location: "Abuja FCT", status: "Active", color: "green" },
    { location: "Port Harcourt", status: "Active", color: "green" },
    { location: "Ibadan", status: "InActive", color: "red" },
];
// Constants
const COLORS = {
    background: "rgba(253, 249, 243, 1)",
    border: "rgba(229, 231, 235, 0.6)",
    borderLight: "rgba(229, 231, 235, 0.8)",
};

const SIZES = {
    touchTarget: "44pt",
    iconContainer: "44pt",
    smallIconContainer: "36pt",
    minText: "11pt",
};


const SectionCard = ({icon: Icon,
                         iconColor,
                         iconBg,
                         title,
                         children,
                         className=""}) => (
    <div
        className={`bg-white rounded-2xl border p-4 my-1 transition-shadow duration-300 ${className}`}
        style={{ borderColor: COLORS.border }}
    >
        <div className="flex items-center gap-3 mb-3">
            <div
                className={`rounded-full ${iconBg} flex items-center justify-center`}
                style={{ width: SIZES.iconContainer, height: SIZES.iconContainer }}
            >
                <Icon className={iconColor} size={22} strokeWidth={2.5} />
            </div>
            <h2 className="font-semibold text-gray-900 text-md sm:text-sm">
                {title}
            </h2>
        </div>
        {children}
    </div>
);



function Main() {
    const {containerRef, useResizer} = useResizeObserver();
    const [showAddBranch, setShowAddBranch] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState("October");
    const [selectedYear, setSelectedYear] = useState(2025);

    const key = `${selectedYear}-${String(months.indexOf(selectedMonth) + 1).padStart(2, "0")}`;
    const performanceStats = performanceData[key] || [];

    const BranchesTable = () => {

        return (
            <div>
                <SectionCard
                    icon={Network}
                    iconColor="text-gray-900"
                    iconBg="bg-gray-50"
                    title="Branches Per State">
                    <div className='relative'>
                        <button onClick={() => setShowAddBranch(true)} className='absolute right-0 -top-20 bg-black text-white px-6 py-2 rounded-2xl cursor-pointer font-semibold transition-colors'>
                            <p className='hidden md:block text-xs'>Add Branch</p>
                            <i className='ri-folder-add-line block md:hidden text-xs' />
                        </button>
                        <Activity
                            title="Lagos"
                            id="BranchCode:Lagos-A4T"
                        />
                        <Activity
                            title="Portharcourt"
                            id="BranchCode:Portharcourt-AWW"
                        />
                        <Activity
                            title="Abuja"
                            id="BranchCode:Abuja-20W"
                        />
                    </div>
                </SectionCard>




                <SectionCard
                    icon={Package}
                    iconColor="text-teal-600"
                    iconBg="bg-teal-50"
                    title="Service Coverage"
                >
                    <div className="space-y-3 relative">
                        {/*<button className='absolute right-0 -top-20 bg-black text-white px-6 py-2 rounded-2xl cursor-pointer font-semibold transition-colors'>Add Coverage</button>*/}

                        {serviceCoverage.map((service, idx) => (
                            <div
                                key={idx}
                                className="flex justify-between items-center p-1 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                    <span className="text-gray-700 text-xs font-medium">
                      {service.location}
                    </span>
                                <span
                                    className={`text-xs font-semibold bg-${service.color}-100 text-${service.color}-700 px-3 py-1 rounded-full`}
                                >
                      {service.status}
                    </span>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            </div>

        )
    }

    return (
        <>
            <main className="w-full flex flex-col gap-8 overflow-y-scroll py-0.5 px-0.5">
                <div ref={containerRef} className={`flex ${useResizer ? 'flex-row' : 'flex-col'} w-full flex-1 gap-4`}>
                    <StatsCard icon='assignment_add' title="Total Deilvery Request" amount="1,250" />
                    <StatsCard icon='cancel' title="Failed Deilveries" amount="5" />
                    <StatsCard icon='pending_actions' title="Pending Deilveries" amount="10" />
                    <StatsCard icon='folder_check' title="Complete Deilveries" amount="900" />
                    <StatsCard icon='contacts_product'  title="Total Customers" amount="900" />
                </div>

                <Activity.Header asideTitle="" title="" children={
                    <>
                        <SectionCard
                            icon={TrendingUp}
                            iconColor="text-gray-900"
                            iconBg="bg-gray-50"
                            title="Review Activities"
                        >
                            {[...Array(8)].map((_, i) => (
                                <Activity
                                    key={i}
                                    icon="/icons/order.svg"
                                    title="New order received"
                                    id="Order#3922090"
                                    time="2hours ago"
                                />
                            ))}


                        </SectionCard>
                        <SectionCard
                            icon={TrendingUp}
                            iconColor="text-gray-900"
                            iconBg="bg-gray-50"
                            title="Monthly Performance"
                        >
                            {/* --- Controls --- */}
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex gap-2">
                                    <select
                                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-gray-300"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                    >
                                        {months.map((m) => (
                                            <option key={m}>{m}</option>
                                        ))}
                                    </select>
                                    <select
                                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-300"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    >
                                        {years.map((y) => (
                                            <option key={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* --- Animated Stats List --- */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={key} // triggers animation when month/year changes
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-4"
                                >
                                    {performanceStats?.map((stat, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex justify-between items-center ${
                                                idx < performanceStats.length - 1 ? "pb-3 border-b border-gray-100" : ""
                                            }`}
                                        >
                                            <span className="text-gray-600 text-xs font-medium">{stat.label}</span>
                                            <span className={`font-semibold ${stat.color} text-xs text-base`}>{stat.value.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </motion.div>
                            </AnimatePresence>

                            {/* --- Animated Bar Chart --- */}
                            <div className="h-64 mt-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={performanceStats}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="label" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar
                                            dataKey="value"
                                            fill="#3b82f6"
                                            radius={[8, 8, 0, 0]}
                                            animationBegin={100}
                                            animationDuration={800}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="h-64 mt-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={financialPerformanceData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="label" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar
                                            dataKey="value"
                                            fill="#3b82f6"
                                            radius={[8, 8, 0, 0]}
                                            animationBegin={100}
                                            animationDuration={800}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </SectionCard>
                    </>

                } asideChildren={ <BranchesTable />} />




            </main>


            {showAddBranch &&  (<AddNewBranch setShowAddBranch={setShowAddBranch}/>)}

        </>

    );
}

export default Main;

interface StatsCardProps {
    title?: string;
    amount?: string;
    icon?: string;
    color?: string;
}
function StatsCard({ amount, title, icon, color }:StatsCardProps) {

    function handleToggle(value:string){
        const openModal = {
            name:"deliveriesModal",
            show:true,
            props: {
                orderData:orders,
                title:value
            }
        }
        sheetActions.toggleBasicResizableSheet(openModal)
    }

    return (
        <div onClick={() => handleToggle(title)} className="flex items-center gap-2 cursor-pointer hover:scale-101 border bg-white border-[#8B2915] p-5 py-4 rounded-lg w-full">
            <div>
                <span className="material-symbols-outlined">{icon}</span>
            </div>
            <div>
                <p className="font-medium text-stone-600">{title}</p>
                <h3 className="font-bold text-lg">{amount}</h3>
            </div>

        </div>
    );
}

interface ActivityProps {
    icon?: string;
    title?: string;
    id?: string;
    time?: string;
}
function Activity({ icon, title, id, time }:ActivityProps) {
    return (
        <div className="flex items-center justify-between gap-4 mb-2 pt-2 hover:bg-gray-100 hover:rounded-lg hover:cursor-pointer">
            <div className="flex items-center gap-4 px-2">
                {/*{icon && (  <i className="w-6 h-6 rounded-sm flex items-center justify-center bg-white">*/}
                {/*    <img src={icon} alt="icon" className="w-4 " />*/}
                {/*</i>)}*/}

                <span className="flex flex-col gap-0.5">
          <p className="font-medium text-xs">{title}</p>
          <p className="text-stone-700 text-xs">{id}</p>
        </span>
            </div>
            {time && (<p className="text-stone-600 px-2">{time}</p>)}
        </div>
    );
}

interface ActivityHeaderProps {
    title?: string;
    children?: any;
    asideTitle?: string;
    asideChildren?:any
}

Activity.Header = function ({ title, children, asideTitle, asideChildren }:ActivityHeaderProps) {
    return (
        <div className='flex w-full gap-3 flex-col md:flex-row'>
            <div className="flex flex-col w-full gap-4">
                <h2 className="font-bold text-stone-950 text-xs">{title}</h2>
                <div className="flex flex-col gap-4">{children}</div>
            </div>
            <div className="flex flex-col w-full gap-4">
                <h2 className="font-bold text-stone-950 text-xs">{asideTitle}</h2>
                <div className="flex flex-col gap-4">{asideChildren}</div>
            </div>
        </div>
    );
};
