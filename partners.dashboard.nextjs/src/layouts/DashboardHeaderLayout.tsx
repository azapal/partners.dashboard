export const DashboardHeaderLayout = () => {
    return (
        <div className='w-full h-fit mb-6 sticky top-[-20px] bg-[#FDF9F3]'>
            <header className="flex flex-col gap-3 text-stone-900">
                <div className="flex items-center justify-between ">
                    <div>
                        <h2 className="font-bold text-sm mb-1">Spoonel service men 's</h2>
                        <h1 className="font-bold text-2xl">Dashboard</h1>
                    </div>

                    <div className='flex flex-col items-end w-fit gap-1'>
                        <div className='flex bg-white rounded w-fit items-center justify-end gap-2 p-1'>
                            <div className='flex flex-col gap-1'>
                                <p className='text-xs font-medium'>Ukonu Ndubuisi Chibuike</p>
                                <p className='text-xs font-medium bg-green-200 w-fit p-0.5 rounded'>Role: Admin</p>
                            </div>

                            <img src='/spoonel_service_men_logo.jpeg' className='w-10 h-10' alt='logo'/>

                        </div>
                    </div>
                </div>
            </header>
        </div>
    )
}