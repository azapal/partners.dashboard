import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSendRepOtp } from '../../hooks/useRepAuth';

export const RepLoginScreen = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { mutate: sendOtp, isPending } = useSendRepOtp();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    sendOtp(
      { email },
      {
        onSuccess: () => navigate('/support/login/otp', { state: { email } }),
        onError: (err: any) => setErrorMessage(err?.message ?? 'Failed to send OTP. Please try again.'),
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white shadow-xl border border-slate-200 rounded-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-[#F14724] to-[#8B2915]" />

        <div className="p-8 pt-10">
          <div className="mb-8 text-center">
            <img src="/azapallogoV1.svg" alt="Azapal" className="h-9 w-auto mx-auto mb-2" />
            <p className="text-sm text-slate-500">Customer Support Login</p>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-slate-800">Welcome back</h2>
            <p className="text-sm text-slate-500 mt-1">Enter your work email to receive a one-time code.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Work email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrorMessage(''); }}
                disabled={isPending}
                className="w-full h-12 px-4 text-base border border-slate-200 rounded-xl outline-none transition focus:border-[#1d4ed8] focus:ring-4 focus:ring-blue-100 text-slate-900 placeholder:text-slate-300 disabled:opacity-50"
              />
            </div>

            {errorMessage && (
              <p className="text-sm text-red-500">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={isPending || !email.trim()}
              className="w-full h-12 bg-[#0d1b3d] hover:bg-[#0d1b3d]/90 text-white font-medium text-base rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? 'Sending OTP…' : 'Continue'}
              {!isPending && <i className="ri-arrow-right-line text-base" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
