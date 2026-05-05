import {AuthLayout} from "../layouts/AuthLayout.js";
import {DefaultButton} from "../components/buttons/DefaultButton.js";
import {DefaultTextInput} from "../components/inputs/DefaultTextInput.js";
import {useState} from "react";
import {Link} from "react-router-dom";

export const LoginScreen = ()  => {
        const [inputTextValue, setInputTextValue] = useState('');
        const [inputPasswordValue, setInputPasswordValue] = useState('');
        const [whoIs, setWhoIs] = useState('PARTNERS');
        const userType = [
                {name:"PARTNERS"},
                {name:"PARTNERS BRANCH"}
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
                        <form onSubmit={handleSubmit} className='w-full space-y-6'>
                                <div className="space-y-2">
                                        <p className="text-2xl font-semibold text-slate-900">Welcome back</p>
                                        <p className="text-sm text-slate-500">Sign in to continue to your dashboard.</p>
                                </div>
                                <SelectUserType />
                                <div className='w-full'>
                                        {whoIs === 'PARTNERS' && (<DefaultTextInput bdColor='#1d4ed8' phColor='#94a3b8' setValue={setInputTextValue} label='Partners code' placeholder='Enter partner code' />)}
                                        {whoIs === 'PARTNERS BRANCH' && (<DefaultTextInput bdColor='#1d4ed8' phColor='#94a3b8' setValue={setInputTextValue} label='Branch code' placeholder='Enter branch code' />)}
                                </div>
                                <Link to={'/login/otp'} className='block'><DefaultButton type={'submit'} text={'Log in'} /></Link>

                        </form>
                        
                </AuthLayout>
        ) ;
}

