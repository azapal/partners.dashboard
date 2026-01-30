import { AuthLayout } from "../layouts/AuthLayout.jsx";
import { useState } from "react";
import {DefaultButton} from "../components/buttons/DefaultButton";

export default function OtpScreen() {


  return (
    <AuthLayout>
      <div className="grid gap-10 px-4 sm:px-6 md:px-8 max-w-md mx-auto">
        {/* Header text */}
        <div className="grid gap-5 mt-10 text-center">
          <p className="font-montserrat font-medium text-base sm:text-lg">
            OTP CODE
          </p>

          <p className="font-montserrat font-semibold text-sm sm:text-base leading-6">
            Enter the OTP code sent to{" "}
            <span className="break-words">spoonelservicemen@gmail.com</span>.
          </p>
        </div>

        {/* OTP inputs */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8">

        </div>

        <DefaultButton type="submit" text="SUBMIT" className="w-full sm:w-auto" />

        <p className="font-montserrat font-semibold text-sm sm:text-base text-center">
          Didn’t receive code?{" "}
          <span className="text-[#2476f1] cursor-pointer">Resend</span>
        </p>
      </div>
    </AuthLayout>
  );
}
