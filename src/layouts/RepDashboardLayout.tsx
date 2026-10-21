import RepSideBar from "../components/support/RepSideBar";
import { RepHeaderLayout } from "./RepHeaderLayout";
import { RepBottomTab } from "../components/support/RepBottomTab";
import { ProductTour } from "../components/tour/ProductTour";

export const RepDashboardLayout = ({ children }: any) => {
  return (
    <section className="flex h-screen overflow-hidden bg-white">
      <RepSideBar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* pb-28 on mobile clears the floating RepBottomTab. */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-28 sm:px-6 md:pb-10 lg:px-8">
          <RepHeaderLayout />
          <main className="mx-auto w-full max-w-7xl">{children}</main>
        </div>
      </div>

      <RepBottomTab />
      <ProductTour variant="support" />
    </section>
  );
};
