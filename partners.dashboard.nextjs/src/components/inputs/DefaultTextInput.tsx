interface propsTypes {
	setValue?:any,
	label?:string,
	validation?:boolean,
	bdColor?:string,
	phColor?:string,
	placeholder?:string,
	error?:string,
	disabled?:boolean,
	value?:string,
}
export const DefaultTextInput = ({setValue, value, ...props}:propsTypes) => {
	const label = props?.label?.toLowerCase()
	return (
		<div>
			<label htmlFor={label} style={{color:`${props.bdColor}`, fontWeight:100}}>{props?.label}</label>
		    <div className={`border my-[5px] flex items-center pl-[12px] gap-[12px] border-${props.bdColor} w-full h-[45px] rounded-[10px] relative`}>
			    <img src='/icons/user.svg' className='' alt={`${label}-icon`}/>
			    <input autoComplete={'off'} value={value} disabled={props.disabled} type={'text'} className={`w-full h-full text-${props.bdColor} outline-none placeholder:text-${props.phColor} placeholder:font-[100] focus:outline-none`} onBlur={e => setValue && setValue(e.target.value)}  onChange={(e) => setValue && setValue(e.target.value)}  placeholder={props?.placeholder}  />
		    </div>
			{props?.error && (<div><p>{props?.error}</p></div>)}
			
		</div>
	)
}