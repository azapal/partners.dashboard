import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSendRepOtp } from '../../hooks/useRepAuth';
import { SupportAuthShell, authInputClass, authPrimaryButtonClass } from '../../components/support/SupportAuthShell';

export const RepLoginScreen = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const { mutate: sendOtp, isPending } = useSendRepOtp();

  // A failed send is reported by the global FeedbackModal (see lib/queryClient),
  // so there's no local error state here.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendOtp(
      { email },
      { onSuccess: () => navigate('/support/login/otp', { state: { email } }) }
    );
  };

  return (
    <SupportAuthShell
      mode="support"
      step={1}
      footer={
        <>
          Branch manager or Super Admin?{' '}
          <Link to="/support/branch-login" className="font-semibold text-brand hover:text-brand-hover">
            Log into a branch
          </Link>
        </>
      }
    >
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
        <p className="mt-1.5 text-sm leading-6 text-slate-500">
          Enter your work email and we'll send you a one-time code.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Work email
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

        <button type="submit" disabled={isPending || !email.trim()} className={authPrimaryButtonClass}>
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
