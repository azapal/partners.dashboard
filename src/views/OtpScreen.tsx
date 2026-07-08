import { useEffect, useRef, useState } from "react";
import { AuthLayout } from "../layouts/AuthLayout.jsx";
import { DefaultButton } from "../components/buttons/DefaultButton";
import { useNavigate, useLocation } from "react-router-dom";
import { useVerifyOtp, useSendOtp, usePartnerProfile } from "../hooks/useAuth";

export default function OtpScreen() {
  const inputRefs = useRef<HTMLInputElement[]>([]);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", ""]);
  const [errorMessage, setErrorMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(120);

  const navigate = useNavigate();
  const location = useLocation();
  const partnerCode: string = location.state?.partnerCode ?? "";

  const { mutate: verifyOtp, isPending } = useVerifyOtp();
  const { mutate: sendOtp, isPending: isResending } = useSendOtp();
  const profile = usePartnerProfile();
  const email = profile?.partner_email ?? localStorage.getItem('partner_email') ?? '';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const focusInput = (index: number) => {
    setTimeout(() => {
      inputRefs.current[index]?.focus();
      inputRefs.current[index]?.select();
    }, 0);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setErrorMessage("");

    setOtpDigits((prev) => {
      const newDigits = [...prev];
      newDigits[index] = value;
      return newDigits;
    });

    if (value && index < 4) focusInput(index + 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      focusInput(index - 1);
    } else if (e.key === "ArrowLeft" && index > 0) {
      focusInput(index - 1);
    } else if (e.key === "ArrowRight" && index < 4) {
      focusInput(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (pasted) {
      const newDigits = pasted.slice(0, 5).split("");
      setOtpDigits(newDigits.concat(Array(5 - newDigits.length).fill("")));
      focusInput(Math.min(newDigits.length, 4));
    } else {
      setErrorMessage("Please paste numeric digits only");
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    focusInput(0);

    return () => clearInterval(timer);
  }, []);

  const otpValue = otpDigits.join("");

  const handleSubmit = () => {
    if (otpValue.length < 5) {
      setErrorMessage("Please enter all 5 digits.");
      return;
    }

    if (!partnerCode) {
      setErrorMessage("Session expired. Please log in again.");
      return;
    }

    verifyOtp(
      { partnerCode, otp: otpValue },
      {
        onSuccess: () => navigate("/dashboard"),
        onError: (err: any) => setErrorMessage(err?.message ?? "Invalid OTP. Please try again."),
      }
    );
  };

  return (
    <AuthLayout>
      <div className="grid gap-8">
        <div className="space-y-2">
          <p className="text-2xl font-semibold text-slate-900">Verify OTP</p>
          <p className="text-sm text-slate-500">
            Enter the 5-digit code sent to{" "}
            <span className="font-medium text-[#1d4ed8]">{email}</span>.
          </p>
          <p className="text-sm text-slate-500">Expires in {formatTime(timeLeft)}</p>
        </div>

        {/* OTP Inputs */}
        <div className="flex justify-center gap-2 sm:gap-3">
          {[...Array(5)].map((_, index) => (
            <input
              key={index}
              ref={(el) => { if (el) inputRefs.current[index] = el; }}
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

        <DefaultButton
          type="submit"
          text={isPending ? "Verifying…" : "Verify code"}
          className="w-full sm:w-auto"
          onClick={handleSubmit}
          disabled={isPending}
        />

        <p className="text-sm text-slate-600 text-center">
          Didn't receive code?{" "}
          <button
            type="button"
            disabled={isResending || timeLeft > 0}
            onClick={() => {
              sendOtp(partnerCode, {
                onSuccess: () => {
                  setTimeLeft(120);
                  setOtpDigits(["", "", "", "", ""]);
                  setErrorMessage("");
                  focusInput(0);
                },
                onError: (err: any) =>
                  setErrorMessage(err?.message ?? "Failed to resend OTP. Please try again."),
              });
            }}
            className="font-medium text-[#1d4ed8] disabled:opacity-40 disabled:cursor-not-allowed hover:underline"
          >
            {isResending ? "Sending…" : timeLeft > 0 ? `Resend in ${formatTime(timeLeft)}` : "Resend"}
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}
