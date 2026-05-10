export const DefaultButton = ({ ...props }) => {
  return (
    <button
      type={props.type}
      onClick={() => props.action}
      disabled={props?.loading || props?.disabled}
      className="w-full hover:opacity-90 cursor-pointer rounded-[10px] h-[45px] flex items-center justify-center bg-gradient-to-r from-[#F14724] to-[#8B2915] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <p className="text-white text-sm font-bold">{props?.text}</p>
    </button>
  );
};
