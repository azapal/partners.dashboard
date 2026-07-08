import RepSideBar from "../components/support/RepSideBar";
import { RepHeaderLayout } from "./RepHeaderLayout";
import { RepBottomTab } from "../components/support/RepBottomTab";

export const RepDashboardLayout = ({ children }: any) => {
  return (
    <section className="flex h-screen overflow-hidden">
      <RepSideBar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 pb-20 md:pb-6">
          <RepHeaderLayout />
          {children}
        </div>
      </div>

      <RepBottomTab />
    </section>
  );
};
