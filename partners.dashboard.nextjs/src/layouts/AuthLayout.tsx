export const AuthLayout = ({children}:any)  => {
	return (
		<div className="relative flex w-full items-start lg:items-center h-screen justify-center">
			<div className='relative w-full h-full bg-no-repeat'>
				<div className="w-full h-screen bg-[#F14724]/30 absolute z-20"></div>
				<img className='h-screen w-full' src='/logistics-trucks.jpg' alt={'image-curve'}/>
			</div>

			
			<div className='w-full relative flex items-center flex-col px-1 md:px-0 z-30'>
				<img src='/azapallogoV1.svg' alt='logo'/>
				
				<p className='text-black font-medium mt-2'>AZAPAL - Logistics Partners Portal</p>
				
				{children}
			</div>
			
		</div>
	) ;
}
