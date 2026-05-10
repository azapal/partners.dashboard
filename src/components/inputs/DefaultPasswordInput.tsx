interface propsTypes {
	setValue?:any,
	label?:string,
	validation?:boolean,
	bdColor?:string,
	phColor?:string,
	placeholder?:string,
	error?:string,
}
export const DefaultPasswordInput = ({setValue, ...props}:propsTypes) => {
	const label = props?.label?.toLowerCase()
	return (
		<div>
			<label htmlFor={label} style={{color:`${props.bdColor}`, fontWeight:100}}>{props?.label}</label>
		    <div className={`border flex my-[5px] items-center pl-[12px] gap-[12px] border-${props.bdColor} w-full h-[45px] rounded-[10px] relative`}>
			    <img src='/icons/lock.svg' className='' alt={`${label}-icon`}/>
			    <input type={'password'} className={`w-full h-full text-${props.bdColor} outline-none placeholder:text--${props.phColor} placeholder:font-[100] focus:outline-none`} onBlur={e => setValue(e.target.value)}  onChange={(e) => setValue(e.target.value)}  placeholder={props?.placeholder}  />
		    </div>
			{/*Validation Note*/}
			{props.validation && (
				<div>
					<p>Password must contain one capital letter</p>
					<p>Password must contain one small letter</p>
					<p>Password must contain one number</p>
					<p>Password must contain one special character</p>
					<p>Password must be at least 8 character long</p>
				</div>
				
			)}
			
			{props.error && (<div><p>{props.error}</p></div>)}
			
		</div>
	)
}