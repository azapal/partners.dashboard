import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSendBranchOtp } from '../../hooks/useBranchAuth';
import { SupportAuthShell, authInputClass, authPrimaryButtonClass } from '../../components/support/SupportAuthShell';

export const BranchLoginScreen = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [branchCode, setBranchCode] = useState('');

  const { mutate: sendOtp, isPending } = useSendBranchOtp();

  // A failed send is reported by the global FeedbackModal (see lib/queryClient),
  // so there's no local error state here.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendOtp(
      { email, branchCode },
      { onSuccess: () => navigate('/support/branch-login/otp', { state: { email, branchCode } }) }
    );
  };

  return (
    <SupportAuthShell
      mode="branch"
      step={1}
      footer={
        <>
          Support rep?{' '}
          <Link to="/support/login" className="font-semibold text-brand hover:text-brand-hover">
            Log in here
          </Link>
        </>
      }
    >
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Log into a branch</h1>
        <p className="mt-1.5 text-sm leading-6 text-slate-500">
          For branch managers and Super Admins. Enter your email and the branch code you want to work in.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </label>
          <div className="relative">
            <i className="ri-mail-line pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              className={`${authInputClass} pl-11`}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="branchCode" className="text-sm font-medium text-slate-700">
            Branch code
          </label>
          <div className="relative">
            <i className="ri-git-branch-line pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-amber-600" />
            <input
              id="branchCode"
              type="text"
              placeholder="e.g. BLC/BRNCH/A"
              value={branchCode}
              onChange={(e) => setBranchCode(e.target.value)}
              disabled={isPending}
              className={`${authInputClass} pl-11 uppercase placeholder:normal-case tracking-wide`}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || !email.trim() || !branchCode.trim()}
          className={authPrimaryButtonClass}
        >
          {isPending ? (
            <>
              <i className="ri-loader-4-line animate-spin text-base" />
              Sending code…
            </>
          ) : (
            <>
              Continue
              <i className="ri-arrow-right-line text-base" />
            </>
          )}
        </button>
      </form>
    </SupportAuthShell>
  );
};
