import SideBar from "../components/dashboard/SideBar";
import { DashboardHeaderLayout } from "./DashboardHeaderLayout";
import { BottomTab } from "../components/dashboard/BottomTab";

export const DashboardLayout = ({ children }: any) => {
  return (
    <section className="flex h-screen  overflow-hidden">
      <SideBar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 pb-20 md:pb-6">
          <DashboardHeaderLayout />
          {children}
        </div>
      </div>

      <BottomTab />
    </section>
  );
};
