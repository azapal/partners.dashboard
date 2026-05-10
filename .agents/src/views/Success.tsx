import { SuccessLayout } from "../layouts/SuccessLayout";
import Confetti from "react-confetti";
import {DefaultButton} from "../components/buttons/DefaultButton";

const Success = () => {
  return (
    <SuccessLayout>
      <Confetti numberOfPieces={300} />
      <div
        className=" max-w-md bg-white rounded-lg border border-gray-200 p-6  items-center justify-center grid gap-6"
        style={{ minHeight: "354px", minWidth: "456px" }}
      >
        <img src="/icons/canfetti.png" alt="" className="mx-auto" />

        <p className="font-spline font-medium text-[48px] leading-[25px] tracking-[2px] text-center ">
          wowzer
        </p>
        <p className="font-spline font-medium text-[16px] leading-[25px] tracking-[2px] text-center">
          congratulations you have completed your registration
        </p>

        <DefaultButton text="Continue" />
      </div>
    </SuccessLayout>
  );
};

export default Success;
