import { useEffect, useRef, useState } from "react";
import { AuthLayout } from "../layouts/AuthLayout.jsx";
import { DefaultButton } from "../components/buttons/DefaultButton";
import {Link} from "react-router-dom";

export default function OtpScreen() {
  const inputRefs = useRef<HTMLInputElement[]>([]);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", ""]);
  const [errorMessage, setErrorMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes countdown

  // Format time to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Focus a specific input
  const focusInput = (index: number) => {
    if (inputRefs.current[index]) {
      setTimeout(() => {
        inputRefs.current[index]?.focus();
        inputRefs.current[index]?.select();
      }, 0);
    }
  };

  // Handle input change
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value.replace(/[^0-9]/g, ""); // numeric only
    setErrorMessage("");

    setOtpDigits((prev) => {
      const newDigits = [...prev];
      newDigits[index] = value;
      return newDigits;
    });

    // Move focus to next input
    if (value && index < 4) focusInput(index + 1);
  };

  // Handle backspace and arrow keys
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      focusInput(index - 1);
    } else if (e.key === "ArrowLeft" && index > 0) {
      focusInput(index - 1);
    } else if (e.key === "ArrowRight" && index < 4) {
      focusInput(index + 1);
    }
  };

  // Handle paste event
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (pasted) {
      const newDigits = pasted.slice(0, 5).split("");
      setOtpDigits((prev) => newDigits.concat(Array(5 - newDigits.length).fill("")));
      focusInput(Math.min(newDigits.length, 4));
    } else {
      setErrorMessage("Please paste numeric digits only");
    }
  };

  // Start countdown on mount
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    focusInput(0);

    return () => clearInterval(timer);
  }, []);

  // Combine digits for submission
  const otpValue = otpDigits.join("");

  return (
    <AuthLayout>
      <div className="grid gap-8">
        <div className="space-y-2">
          <p className="text-2xl font-semibold text-slate-900">Verify OTP</p>
          <p className="text-sm text-slate-500">
            Enter the 5-digit code sent to{" "}
            <span className="font-medium text-[#1d4ed8]">spoonelservicemen@gmail.com</span>.
          </p>
          <p className="text-sm text-slate-500">Expires in {formatTime(timeLeft)}</p>
        </div>

        {/* OTP Inputs */}
        <div className="flex justify-center gap-2 sm:gap-3">
          {[...Array(5)].map((_, index) => (
            <input
              key={index}
              ref={(el) => {
                if (el) inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={otpDigits[index]}
              onChange={(e) => handleInput(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-slate-200 text-center text-xl font-semibold text-slate-900 outline-none transition focus:border-[#1d4ed8] focus:ring-4 focus:ring-blue-100"
            />
          ))}
        </div>

        {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

        <Link to={'/dashboard'}><DefaultButton
          type="submit"
          text="Verify code"
          className="w-full sm:w-auto"
          onClick={() => console.log("OTP Submitted:", otpValue)}
        /></Link>

        <p className="text-sm text-slate-600 text-center">
          Didn’t receive code?{" "}
          <span
            className="cursor-pointer font-medium text-[#1d4ed8]"
            onClick={() => setTimeLeft(120)}
          >
            Resend
          </span>
        </p>
      </div>
    </AuthLayout>
  );
}


