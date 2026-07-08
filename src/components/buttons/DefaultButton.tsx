export const DefaultButton = ({ ...props }) => {
  const label = props?.text ?? props?.label;
  const isSecondary = props?.variant === 'secondary';

  return (
    <button
      type={props.type ?? 'button'}
      onClick={props.onClick}
      disabled={props?.loading || props?.disabled}
      className={`hover:opacity-90 cursor-pointer rounded-[10px] h-11.25 px-5 flex items-center justify-center transition-opacity disabled:opacity-50 disabled:cursor-not-allowed
        ${isSecondary
          ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          : 'w-full bg-linear-to-r from-[#F14724] to-[#8B2915]'
        }
        ${props?.className ?? ''}`}
    >
      <p className={`text-sm font-bold ${isSecondary ? 'text-gray-700' : 'text-white'}`}>
        {label}
      </p>
    </button>
  );
};
