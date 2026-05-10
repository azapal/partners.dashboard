import {useLocation} from "react-router-dom";
import {sheetActions} from "../store/client/sheets";

export const DashboardHeaderLayout = () => {
    const route = useLocation()
    function handleToggle(value?:string, modalName?:string){
        const openModal = {
            name:modalName,
            show:true,
            props: {
                title:value
            }
        }
        sheetActions.toggleBasicResizableSheet(openModal)
    }
    return (
        <div className='w-full h-fit mb-6 sticky top-[-20px] bg-[#FDF9F3]'>
            <header className="flex flex-col gap-3 text-stone-900">
                <div className="flex items-center justify-between ">
                    <div>
                        <h2 className="font-bold text-sm mb-1">Spoonel service men 's</h2>
                        <h1 className="font-bold text-2xl capitalize">{route?.pathname.replaceAll('/', '')}</h1>
                    </div>

                    <div className='flex flex-col items-end w-fit gap-1' onClick={() => handleToggle('account information', 'accountView')}>
                        <img  src='/spoonel_service_men_logo.jpeg' className='w-10 h-10' alt='logo'/>
                        {/*<div className='flex bg-white shadow rounded w-fit items-center justify-end gap-2 p-1'>*/}
                        {/*    <div className='flex flex-col gap-1'>*/}
                        {/*        <p className='text-xs font-medium'>Ukonu Ndubuisi</p>*/}
                        {/*        <p className='text-xs font-medium w-fit p-0.5 rounded-lg'>Role: Admin</p>*/}
                        {/*    </div>*/}

                        {/*   */}

                        {/*</div>*/}
                    </div>
                </div>
            </header>
        </div>
    )
}