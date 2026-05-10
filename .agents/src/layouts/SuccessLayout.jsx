export const SuccessLayout = ({ children }) => {
  return (
    <div className="bg-[#FDF9F3]">
      <img
        src="/azapallogoV1.svg"
        alt="logo"
        className="fixed top-0 left-0 w-15 h-auto z-50"
      />
      <div className="relative flex  items-center h-screen justify-center">
        <img
          className="fixed hidden lg:block right-0 top-[-1px] h-full z-10"
          src="/authlayout_curvex2.png"
          alt={"image-curve"}
        />

        <div className="w-md flex items-center flex-col px-1 md:px-0 z-30">
          {children}
        </div>
      </div>
    </div>
  );
};
