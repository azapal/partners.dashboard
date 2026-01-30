import {sheetActions, } from "../../store/client/sheets";
import {useResizeObserver} from "../../hooks/useResizeObserver";
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

const BranchesTable = () => {
    return (
        <div className='flex gap-4'>
            <div className='bg-white p-3 flex-1 rounded shadow'>
                <Activity
                    title="Lagos Island"
                    id="Order#3922090"
                />
                <Activity
                    title="Lagos Mainland"
                    id="Order#3922090"
                />
                <Activity
                    title="Abuja"
                    id="Order#3922090"
                />
            </div>
            <div className='bg-white p-3 rounded shadow'>
                <Activity
                    title="Lagos Island"
                    id="Order#3922090"
                />
                <Activity
                    title="Lagos Mainland"
                    id="Order#3922090"
                />
                <Activity
                    title="Abuja"
                    id="Order#3922090"
                />
            </div>
        </div>

    )
}
function Main() {
  const {containerRef, useResizer} = useResizeObserver();

  return (
    <main className="w-full flex flex-col gap-8 overflow-y-scroll py-0.5 px-0.5">
        <div ref={containerRef} className={`flex ${useResizer ? 'flex-row' : 'flex-col'} w-full flex-1 gap-4`}>
            <StatsCard  title="Total Deilvery Request" amount="1,250" />
            <StatsCard title="Failed Deilveries" amount="5" />
            <StatsCard title="Pending Deilveries" amount="10" />
            <StatsCard title="Complete Deilveries" amount="900" />
        </div>

        <Activity.Header asideTitle="Branches" title="Review Activities" children={
            <div className='py-3 bg-white shadow'>
                <Activity
                    icon="/icons/order.svg"
                    title="New order received"
                    id="Order#3922090"
                    time="2hours ago"
                />
                <Activity
                    icon="/icons/truck.svg"
                    title="New order received"
                    id="Order#3922090"
                    time="2hours ago"
                />
                <Activity
                    icon="/icons/delivered.svg"
                    title="New order received"
                    id="Order#3922090"
                    time="2hours ago"
                />
                <Activity
                    icon="/icons/clock.svg"
                    title="Delivery request pending"
                    id="Order#3922090"
                    time="2hours ago"
                />
                <Activity
                    icon="/icons/cash.svg"
                    title="Payment received"
                    id="Order#3922090"
                    time="2hours ago"
                />
                <Activity
                    icon="/icons/cash.svg"
                    title="Payment received"
                    id="Order#3922090"
                    time="2hours ago"
                />
                <Activity
                    icon="/icons/cash.svg"
                    title="Payment received"
                    id="Order#3922090"
                    time="2hours ago"
                />
                <Activity
                    icon="/icons/cash.svg"
                    title="Payment received"
                    id="Order#3922090"
                    time="2hours ago"
                />
                <Activity
                    icon="/icons/cash.svg"
                    title="Payment received"
                    id="Order#3922090"
                    time="2hours ago"
                />
                <Activity
                    icon="/icons/clock.svg"
                    title="Delivery request pending"
                    id="Order#3922090"
                    time="2hours ago"
                />
                <Activity
                    icon="/icons/cash.svg"
                    title="Payment received"
                    id="Order#3922090"
                    time="2hours ago"
                />
                <Activity
                    icon="/icons/cash.svg"
                    title="Payment received"
                    id="Order#3922090"
                    time="2hours ago"
                />
                <Activity
                    icon="/icons/cash.svg"
                    title="Payment received"
                    id="Order#3922090"
                    time="2hours ago"
                />
                <Activity
                    icon="/icons/cash.svg"
                    title="Payment received"
                    id="Order#3922090"
                    time="2hours ago"
                />
                <Activity
                    icon="/icons/cash.svg"
                    title="Payment received"
                    id="Order#3922090"
                    time="2hours ago"
                />
            </div>
        } asideChildren={ <BranchesTable />} />

    </main>
  );
}

export default Main;

interface StatsCardProps {
    title: string;
    amount: string;
}
function StatsCard({ amount, title }:StatsCardProps) {

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
    <span onClick={() => handleToggle(title)} className="flex flex-col gap-0.5 border border-[#8B2915] p-5 py-4 rounded-lg w-full">
      <p className="font-medium text-stone-600">{title}</p>
      <h3 className="font-bold text-lg">{amount}</h3>
    </span>
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
    <div className="flex items-center justify-between gap-4 mb-2 pt-2 hover:bg-pink-400/50">
      <div className="flex items-center gap-4 px-2">
          {icon && (  <i className="w-6 h-6 rounded-sm flex items-center justify-center bg-white">
              <img src={icon} alt="icon" className="w-4 " />
          </i>)}

        <span className="flex flex-col gap-0.5">
          <p className="font-medium">{title}</p>
          <p className="text-stone-700">{id}</p>
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
          <h2 className="font-bold text-stone-950 text-sm">{title}</h2>
          <div className="flex flex-col gap-4">{children}</div>
        </div>
        <div className="flex flex-col w-full gap-4">
              <h2 className="font-bold text-stone-950 text-sm">{asideTitle}</h2>
              <div className="flex flex-col gap-4">{asideChildren}</div>
          </div>
      </div>
  );
};
