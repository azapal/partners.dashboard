import {DashboardLayout} from "../layouts/DashboardLayout";
export const CustomerScreen = () => {
    return (
        <DashboardLayout>
            <div className="flex flex-1 justify-center py-5">
                <div className="layout-content-container flex flex-col flex-1">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-lg p-6 bg-[#f0f2f4]">
                            <p className="text-[#111418] text-base font-medium leading-normal">Total Customers</p>
                            <p className="text-[#111418] tracking-light text-2xl font-bold leading-tight">1,234</p>
                        </div>
                    </div>
                    <h2 className="text-[#111418] text-[22px] font-bold leading-tight tracking-[-0.015em]  pb-3 pt-5">Subscribed
                        Customers</h2>
                    <div className="py-3">
                        <div className="flex overflow-hidden rounded-lg border border-[#dbe0e6] bg-white">
                            <table className="flex-1">
                                <thead>
                                <tr className="bg-white">
                                    <th className="table-0e9be9ef-fc54-41dc-ba3f-8c100a1fcf8c-column-120 px-4 py-3 text-left text-[#111418] w-[400px] text-sm font-medium leading-normal">
                                        Customer Name
                                    </th>
                                    <th className="table-0e9be9ef-fc54-41dc-ba3f-8c100a1fcf8c-column-240 px-4 py-3 text-left text-[#111418] w-[400px] text-sm font-medium leading-normal">
                                        Subscription Type
                                    </th>
                                    <th className="table-0e9be9ef-fc54-41dc-ba3f-8c100a1fcf8c-column-360 px-4 py-3 text-left text-[#111418] w-60 text-sm font-medium leading-normal">Status</th>
                                    <th className="table-0e9be9ef-fc54-41dc-ba3f-8c100a1fcf8c-column-480 px-4 py-3 text-left text-[#111418] w-[400px] text-sm font-medium leading-normal">
                                        Last Updated
                                    </th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr className="border-t border-t-[#dbe0e6]">
                                    <td className="table-0e9be9ef-fc54-41dc-ba3f-8c100a1fcf8c-column-120 h-[72px] px-4 py-2 w-[400px] text-[#111418] text-sm font-normal leading-normal">
                                        Sophia Clark
                                    </td>
                                    <td className="table-0e9be9ef-fc54-41dc-ba3f-8c100a1fcf8c-column-240 h-[72px] px-4 py-2 w-[400px] text-[#617589] text-sm font-normal leading-normal">Premium</td>
                                    <td className="table-0e9be9ef-fc54-41dc-ba3f-8c100a1fcf8c-column-360 h-[72px] px-4 py-2 w-60 text-sm font-normal leading-normal">
                                        <button
                                            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 bg-[#f0f2f4] text-[#111418] text-sm font-medium leading-normal w-full"
                                        >
                                            <span className="truncate">Active</span>
                                        </button>
                                    </td>
                                    <td className="table-0e9be9ef-fc54-41dc-ba3f-8c100a1fcf8c-column-480 h-[72px] px-4 py-2 w-[400px] text-[#617589] text-sm font-normal leading-normal">
                                        2023-08-15
                                    </td>
                                </tr>
                                <tr className="border-t border-t-[#dbe0e6]">
                                    <td className="table-0e9be9ef-fc54-41dc-ba3f-8c100a1fcf8c-column-120 h-[72px] px-4 py-2 w-[400px] text-[#111418] text-sm font-normal leading-normal">
                                        Ethan Carter
                                    </td>
                                    <td className="table-0e9be9ef-fc54-41dc-ba3f-8c100a1fcf8c-column-240 h-[72px] px-4 py-2 w-[400px] text-[#617589] text-sm font-normal leading-normal">Standard</td>
                                    <td className="table-0e9be9ef-fc54-41dc-ba3f-8c100a1fcf8c-column-360 h-[72px] px-4 py-2 w-60 text-sm font-normal leading-normal">
                                        <button
                                            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 bg-[#f0f2f4] text-[#111418] text-sm font-medium leading-normal w-full"
                                        >
                                            <span className="truncate">Active</span>
                                        </button>
                                    </td>
                                    <td className="table-0e9be9ef-fc54-41dc-ba3f-8c100a1fcf8c-column-480 h-[72px] px-4 py-2 w-[400px] text-[#617589] text-sm font-normal leading-normal">
                                        2023-08-10
                                    </td>
                                </tr>
                                <tr className="border-t border-t-[#dbe0e6]">
                                    <td className="table-0e9be9ef-fc54-41dc-ba3f-8c100a1fcf8c-column-120 h-[72px] px-4 py-2 w-[400px] text-[#111418] text-sm font-normal leading-normal">
                                        Olivia Bennett
                                    </td>
                                    <td className="table-0e9be9ef-fc54-41dc-ba3f-8c100a1fcf8c-column-240 h-[72px] px-4 py-2 w-[400px] text-[#617589] text-sm font-normal leading-normal">Basic</td>
                                    <td className="table-0e9be9ef-fc54-41dc-ba3f-8c100a1fcf8c-column-360 h-[72px] px-4 py-2 w-60 text-sm font-normal leading-normal">
                                        <button
                                            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 bg-[#f0f2f4] text-[#111418] text-sm font-medium leading-normal w-full"
                                        >
                                            <span className="truncate">Inactive</span>
                                        </button>
                                    </td>
                                    <td className="table-0e9be9ef-fc54-41dc-ba3f-8c100a1fcf8c-column-480 h-[72px] px-4 py-2 w-[400px] text-[#617589] text-sm font-normal leading-normal">
                                        2023-07-20
                                    </td>
                                </tr>
                                <tr className="border-t border-t-[#dbe0e6]">
                                    <td className="table-0e9be9ef-fc54-41dc-ba3f-8c100a1fcf8c-column-120 h-[72px] px-4 py-2 w-[400px] text-[#111418] text-sm font-normal leading-normal">
                                        Liam Harper
                                    </td>
                                    <td className="table-0e9be9ef-fc54-41dc-ba3f-8c100a1fcf8c-column-240 h-[72px] px-4 py-2 w-[400px] text-[#617589] text-sm font-normal leading-normal">Premium</td>
                                    <td className="table-0e9be9ef-fc54-41dc-ba3f-8c100a1fcf8c-column-360 h-[72px] px-4 py-2 w-60 text-sm font-normal leading-normal">
                                        <button
                                            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 bg-[#f0f2f4] text-[#111418] text-sm font-medium leading-normal w-full"
                                        >
                                            <span className="truncate">Active</span>
                                        </button>
                                    </td>
                                    <td className="table-0e9be9ef-fc54-41dc-ba3f-8c100a1fcf8c-column-480 h-[72px] px-4 py-2 w-[400px] text-[#617589] text-sm font-normal leading-normal">
                                        2023-08-05
                                    </td>
                                </tr>
                                <tr className="border-t border-t-[#dbe0e6]">
                                    <td className="table-0e9be9ef-fc54-41dc-ba3f-8c100a1fcf8c-column-120 h-[72px] px-4 py-2 w-[400px] text-[#111418] text-sm font-normal leading-normal">
                                        Ava Foster
                                    </td>
                                    <td className="table-0e9be9ef-fc54-41dc-ba3f-8c100a1fcf8c-column-240 h-[72px] px-4 py-2 w-[400px] text-[#617589] text-sm font-normal leading-normal">Standard</td>
                                    <td className="table-0e9be9ef-fc54-41dc-ba3f-8c100a1fcf8c-column-360 h-[72px] px-4 py-2 w-60 text-sm font-normal leading-normal">
                                        <button
                                            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 bg-[#f0f2f4] text-[#111418] text-sm font-medium leading-normal w-full"
                                        >
                                            <span className="truncate">Active</span>
                                        </button>
                                    </td>
                                    <td className="table-0e9be9ef-fc54-41dc-ba3f-8c100a1fcf8c-column-480 h-[72px] px-4 py-2 w-[400px] text-[#617589] text-sm font-normal leading-normal">
                                        2023-08-01
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    )
}