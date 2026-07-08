interface PropsTypes {
  setValue?: (value: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  validation?: boolean;
  bdColor?: string;
  phColor?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  value?: string;
  type?: string;
  required?: boolean;
}

export const DefaultTextInput = ({ setValue, onChange, value, ...props }: PropsTypes) => {
  const label = props?.label?.toLowerCase();
  return (
    <div>
      <label htmlFor={label} style={{ color: `${props.bdColor}`, fontWeight: 100 }}>
        {props?.label}
      </label>
      <div className={`border my-[5px] flex items-center pl-[12px] gap-[12px] border-${props.bdColor} w-full h-[45px] rounded-[10px] relative`}>
        <img src="/icons/user.svg" className="" alt={`${label}-icon`} />
        <input
          id={label}
          autoComplete="off"
          value={value}
          disabled={props.disabled}
          type={props.type ?? 'text'}
          required={props.required}
          className={`w-full h-full text-${props.bdColor} outline-none placeholder:text-${props.phColor} placeholder:font-[100] focus:outline-none`}
          placeholder={props?.placeholder}
          onChange={(e) => {
            onChange?.(e);
            setValue?.(e.target.value);
          }}
          onBlur={(e) => setValue?.(e.target.value)}
        />
      </div>
      {props?.error && <p className="text-red-500 text-xs mt-1">{props?.error}</p>}
    </div>
  );
};