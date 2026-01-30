export const DefaultButton = ({ ...props }) => {
  return (
    <button
      type={props.type}
      onClick={() => props.action}
      disabled={props?.loading}
      className="w-full hover:opacity-90 cursor-pointer rounded-[10px] h-[45px] flex items-center justify-center bg-gradient-to-r from-[#F14724] to-[#8B2915]"
    >
      <p className="text-white text-sm font-bold">{props?.text}</p>
    </button>
  );
};
