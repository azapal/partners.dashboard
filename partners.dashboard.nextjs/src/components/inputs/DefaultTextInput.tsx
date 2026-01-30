interface propsTypes {
	setValue?:any,
	label?:string,
	validation?:boolean,
	bdColor?:string,
	phColor?:string,
	placeholder?:string,
	error?:string,
}
export const DefaultTextInput = ({setValue, ...props}:propsTypes) => {
	const label = props?.label?.toLowerCase()
	return (
		<div>
			<label htmlFor={label} style={{color:`${props.bdColor}`, fontWeight:100}}>{props?.label}</label>
		    <div className={`border my-[5px] flex items-center pl-[12px] gap-[12px] border-${props.bdColor} w-full h-[45px] rounded-[10px] relative`}>
			    <img src='/icons/user_white.svg' className='' alt={`${label}-icon`}/>
			    <input type={'text'} className={`w-full h-full text-${props.bdColor} outline-none placeholder:text-${props.phColor} placeholder:font-[100] focus:outline-none`} onBlur={e => setValue(e.target.value)}  onChange={(e) => setValue(e.target.value)}  placeholder={props?.placeholder}  />
		    </div>
			{props?.error && (<div><p>{props?.error}</p></div>)}
			
		</div>
	)
}