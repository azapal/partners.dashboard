import SideBar from "../components/dashboard/SideBar";
import {DashboardHeaderLayout} from "./DashboardHeaderLayout";
import {BottomTab} from "../components/dashboard/BottomTab";
export const DashboardLayout = ({children}:any) => {
    return (
        <section className="flex h-screen bg-[#FDF9F3]">

            <SideBar />


            <div className='w-full p-5 h-fit pb-18 md:pb-5'>
                <DashboardHeaderLayout />
                {children}
            </div>

            <BottomTab />

        </section>

    )
}