import {AuthLayout} from "../layouts/AuthLayout.js";
import {DefaultButton} from "../components/buttons/DefaultButton.js";
import {DefaultTextInput} from "../components/inputs/DefaultTextInput.js";
import {DefaultPasswordInput} from "../components/inputs/DefaultPasswordInput.js";
import {useState} from "react";

export const LoginScreen = ()  => {
	const [inputTextValue, setInputTextValue] = useState('');
	const [inputPasswordValue, setInputPasswordValue] = useState('');
	const [whoIs, setWhoIs] = useState('');
	const userType = [
		{name:"Continue as manager"},
		{name:"Continue as Other"}
	]
	
	const SelectUserType = () => {
		return <div className="w-full my-5">
			<div className="w-full flex flex-col gap-5">
				{userType.map((item, index) => (
					<div key={index} onClick={() => setWhoIs(item.name)} className={`border border-black cursor-pointer w-full  flex items-center justify-between py-3 px-3 rounded-[8px]`}>
						<p className="text-sm text-black">{item.name}</p>
						{whoIs === item.name ?
						<img src="/icons/checkbox_checked.svg" alt="checked"/>
							:
						<img src="/icons/checkbox_unchecked.svg" alt="unchecked"/>
						}
					</div>
				))}
				
			
			</div>
		</div>
	}
	
	const handleSubmit = async (e:any) => {
		e.preventDefault();
		console.log(inputTextValue)
		console.log(inputPasswordValue)
		setInputPasswordValue('')
		setInputTextValue('')
	}
	return (
		<AuthLayout>
			<form onSubmit={handleSubmit} className='lg:w-md w-fill px-3'>
				<SelectUserType />
				
				{/*<div className="relative lg:mb-8 mb-4">*/}
				{/*	<div className="absolute inset-0 flex items-center">*/}
				{/*		<div className="w-full border-t border-gray-300"></div>*/}
				{/*	</div>*/}
				{/*	<div className="relative flex justify-center text-sm">*/}
				{/*		<span className="px-2 bg-white text-gray-500">Continue with email</span>*/}
				{/*</div>*/}
				{/*</div>*/}
			
				<div className='w-full mb-[32px]'>
					<DefaultTextInput bdColor='black' phColor='black' setValue={setInputTextValue} label='EMAIL' placeholder={'example@gmail.com'} />
					<DefaultPasswordInput bdColor='black' phColor='black' setValue={setInputPasswordValue} label='PASSWORD' placeholder={'*************'} />
				</div>
				<DefaultButton type={'submit'} text={'LOG IN'} />
				
				<div className='text-center mt-[24px]'>
					<a href='#' className='text-sm text-black underline'>Forgot Password</a>
				
				</div>
			</form>
			
		</AuthLayout>
	) ;
}

