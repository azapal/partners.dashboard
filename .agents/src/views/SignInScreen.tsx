import {AuthLayout} from "../layouts/AuthLayout.js";
import {DefaultButton} from "../components/buttons/DefaultButton.js";
import {DefaultTextInput} from "../components/inputs/DefaultTextInput.js";
import {DefaultPasswordInput} from "../components/inputs/DefaultPasswordInput.js";
import {useState} from "react";

export const SignInScreen = ()  => {
    const [inputTextValue, setInputTextValue] = useState('');
    const [inputPasswordValue, setInputPasswordValue] = useState('');
    
    
    const handleSubmit = async (e:any) => {
        e.preventDefault();
        console.log(inputTextValue)
        console.log(inputPasswordValue)
        setInputPasswordValue('')
        setInputTextValue('')
    }
    return (
        <AuthLayout>
            <form onSubmit={handleSubmit} className='w-full'>
                <div className='w-full mb-[32px]'>
                    <div className='flex'>
                        <div>
                            <DefaultTextInput setValue={setInputTextValue} label='TITLE' placeholder={'MR/MISS/MRS'} />
                        </div>
                        <div className='flex-1 w-full'>
                            <DefaultTextInput setValue={setInputTextValue} label='FIRST NAME' placeholder={'James'} />
                        </div>
                    </div>
                    <DefaultTextInput setValue={setInputTextValue} label='LAST NAME' placeholder={'Doe'} />
                    <DefaultTextInput setValue={setInputTextValue} label='PHONE NUMBER' placeholder={'+234 9049929256'} />
                    
                    <DefaultTextInput setValue={setInputTextValue} label='EMAIL' placeholder={'example@gmail.com'} />
                    <DefaultPasswordInput setValue={setInputPasswordValue} label='PASSWORD' placeholder={'*************'} />
                </div>
                <DefaultButton type={'submit'} text={'SIGN IN'} />
                
            </form>
            
        </AuthLayout>
    ) ;
}

