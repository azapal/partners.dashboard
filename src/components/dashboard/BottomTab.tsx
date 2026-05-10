import {SidebarButton} from "./SideBar";

export const BottomTab = () => {
    return (
        <div className='w-full flex md:hidden items-center justify-center fixed bottom-0 right-0 left-0'>

            <div className="flex bg-orange-100 gap-8 p-2 m-2 rounded-2xl shadow w-fit justify-between items-center">
                {/*/!*admin *!/ sales/operations/engineers/*/}
                <SidebarButton to="/dashboard" className='ri-home-6-line text-xl'>
                    Dashboard
                </SidebarButton>

                {/*/!*admin */}
                <SidebarButton to="/service" className='ri-task-line text-xl'>
                    Services
                </SidebarButton>

                {/*/!*admin */}
                {/*  <SidebarButton to="/customers" src="/icons/customers.svg">*/}
                {/*  Customers*/}
                {/*</SidebarButton>*/}

                {/*/!*admin/engineers*/}
                {/*  <SidebarButton to="/customers" src="/icons/customers.svg">*/}
                {/*      Integrations*/}
                {/*</SidebarButton>*/}

                {/*/!*admin *!/ sales/operations/engineers/*/}
                <SidebarButton to="/settings" className='ri-user-settings-line text-xl'>
                    Settings
                </SidebarButton>
            </div>
        </div>
    )
}