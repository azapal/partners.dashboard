import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useVerifyBranchOtp, useSendBranchOtp } from "../../hooks/useBranchAuth";
import { isElevatedAdminRole } from "../../service/repService";
import { SupportAuthShell, authPrimaryButtonClass } from "../../components/support/SupportAuthShell";
import { OtpCodeField } from "../../components/support/OtpCodeField";

export default function BranchOtpScreen() {
  const inputRefs = useRef<HTMLInputElement[]>([]);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", ""]);
  // Client-side validation only — a rejected code or failed resend is shown by
  // the global FeedbackModal (see lib/queryClient).
  const [errorMessage, setErrorMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(120);

  const navigate = useNavigate();
  const location = useLocation();
  const email: string = location.state?.email ?? "";
  const branchCode: string = location.state?.branchCode ?? "";

  const { mutate: verifyOtp, isPending } = useVerifyBranchOtp();
  const { mutate: sendOtp, isPending: isResending } = useSendBranchOtp();

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

    if (!email || !branchCode) {
      setErrorMessage("Session expired. Please log in again.");
      return;
    }

    verifyOtp(
      { email, otp: otpValue, branchCode },
      {
        // Tenant Admin/Super Admin land on the full main dashboard; every
        // other role keeps landing on the smaller /support dashboard.
        onSuccess: (data: any) =>
          navigate(isElevatedAdminRole(data?.data?.invite_role?.name) ? "/dashboard" : "/support/dashboard"),
      }
    );
  };

  const handleResend = () => {
    sendOtp(
      { email, branchCode },
      {
        onSuccess: () => {
          setTimeLeft(120);
          setOtpDigits(["", "", "", "", ""]);
          setErrorMessage("");
          focusInput(0);
        },
      }
    );
  };

  return (
    <SupportAuthShell
      mode="branch"
      step={2}
      footer={
        <>
          Wrong email or branch?{" "}
          <Link to="/support/branch-login" className="font-semibold text-brand hover:text-brand-hover">
            Start again
          </Link>
        </>
      }
    >
      <form
        className="grid gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Check your email</h1>
          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            Enter the 5-digit code sent to
            <span className="block break-all font-semibold text-slate-800">{email || "your email"}</span>
          </p>
          {branchCode && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200/60">
              <i className="ri-git-branch-line" />
              Branch {branchCode}
            </p>
          )}
        </div>

        <OtpCodeField
          digits={otpDigits}
          inputRefs={inputRefs}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          hasError={!!errorMessage}
        />

        {errorMessage && (
          <p className="-mt-2 flex items-center gap-1.5 text-sm text-red-600">
            <i className="ri-error-warning-line" />
            {errorMessage}
          </p>
        )}

        <button type="submit" disabled={isPending} className={authPrimaryButtonClass}>
          {isPending ? (
            <>
              <i className="ri-loader-4-line animate-spin text-base" />
              Verifying…
            </>
          ) : (
            <>
              Verify code
              <i className="ri-shield-check-line text-base" />
            </>
          )}
        </button>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
          <span className="flex items-center gap-1.5 text-slate-500">
            <i className="ri-time-line text-amber-600" />
            {timeLeft > 0 ? <>Expires in <span className="font-semibold tabular-nums text-slate-700">{formatTime(timeLeft)}</span></> : "Code expired"}
          </span>
          <span className="text-slate-500">
            Didn't receive code?{" "}
            <button
              type="button"
              disabled={isResending || timeLeft > 0}
              onClick={handleResend}
              className="font-semibold text-brand hover:text-brand-hover disabled:cursor-not-allowed disabled:text-slate-400"
            >
              {isResending ? "Sending…" : timeLeft > 0 ? `Resend in ${formatTime(timeLeft)}` : "Resend"}
            </button>
          </span>
        </div>
      </form>
    </SupportAuthShell>
  );
}
