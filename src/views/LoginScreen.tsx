import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSendOtp } from '../hooks/useAuth';
import { useSendBranchOtp } from '../hooks/useBranchAuth';

export const LoginScreen = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<0 | 1>(0);
  const [accountType, setAccountType] = useState<'PARTNERS' | 'PARTNERS BRANCH' | null>(null);
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { mutate: sendOtp, isPending: isSendingPartnerOtp } = useSendOtp();
  const { mutate: sendBranchOtp, isPending: isSendingBranchOtp } = useSendBranchOtp();
  const isBranch = accountType === 'PARTNERS BRANCH';
  const isPending = isBranch ? isSendingBranchOtp : isSendingPartnerOtp;

  const handleSelect = (type: 'PARTNERS' | 'PARTNERS BRANCH') => {
    setAccountType(type);
    setStep(1);
  };

  const handleBack = () => {
    setStep(0);
    setAccountType(null);
    setCode('');
    setEmail('');
    setBranchCode('');
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (isBranch) {
      sendBranchOtp(
        { email, branchCode },
        {
          onSuccess: () => navigate('/support/branch-login/otp', { state: { email, branchCode } }),
          onError: (err: any) => setErrorMessage(err?.message ?? 'Failed to send OTP. Please try again.'),
        }
      );
      return;
    }

    sendOtp(code, {
      onSuccess: () => navigate('/login/otp', { state: { partnerCode: code, accountType } }),
      onError: (err: any) => setErrorMessage(err?.message ?? 'Failed to send OTP. Please try again.'),
    });
  };

  const canSubmit = isBranch ? email.trim() && branchCode.trim() : code.trim();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white shadow-xl border border-slate-200 rounded-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-[#F14724] to-[#8B2915]" />

        <div className="p-8 pt-10">
          <div className="mb-8 text-center">
            <img src="/azapallogoV1.svg" alt="Azapal" className="h-9 w-auto mx-auto mb-2" />
            <p className="text-sm text-slate-500">Partner Portal</p>
          </div>

          <div className="relative overflow-hidden">
            {step === 0 ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-slate-800">Who are you?</h2>
                  <p className="text-sm text-slate-500 mt-1">Select your account type to continue.</p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => handleSelect('PARTNERS')}
                    className="w-full group text-left flex items-start p-5 rounded-xl border-2 border-slate-100 hover:border-[#1d4ed8] hover:bg-blue-50/50 transition-all duration-200 cursor-pointer"
                  >
                    <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-[#1d4ed8] flex items-center justify-center shrink-0 transition-colors">
                      <i className="ri-building-2-line text-lg" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-semibold text-slate-900 group-hover:text-[#1d4ed8] transition-colors">Partner</h3>
                      <p className="text-sm text-slate-500 mt-1">Main headquarters or primary business account.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelect('PARTNERS BRANCH')}
                    className="w-full group text-left flex items-start p-5 rounded-xl border-2 border-slate-100 hover:border-[#1d4ed8] hover:bg-blue-50/50 transition-all duration-200 cursor-pointer"
                  >
                    <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-[#1d4ed8] flex items-center justify-center shrink-0 transition-colors">
                      <i className="ri-git-branch-line text-lg" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-semibold text-slate-900 group-hover:text-[#1d4ed8] transition-colors">Partner Branch</h3>
                      <p className="text-sm text-slate-500 mt-1">A specific location or subsidiary branch.</p>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                <button
                  onClick={handleBack}
                  className="flex items-center text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6 -ml-2 p-2 rounded-md hover:bg-slate-100 cursor-pointer"
                >
                  <i className="ri-arrow-left-s-line text-base mr-1" />
                  Back
                </button>

                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-slate-800">
                    {isBranch ? 'Branch Login' : 'Partner Login'}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {isBranch
                      ? 'For branch managers and Super Admins. Enter your email and the branch code you want to work in.'
                      : 'Enter your access code to authenticate.'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {isBranch ? (
                    <>
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-slate-700">
                          Email
                        </label>
                        <input
                          id="email"
                          type="email"
                          placeholder="you@company.com"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setErrorMessage(''); }}
                          disabled={isPending}
                          className="w-full h-12 px-4 text-lg border border-slate-200 rounded-xl outline-none transition focus:border-[#1d4ed8] focus:ring-4 focus:ring-blue-100 text-slate-900 placeholder:text-slate-300 disabled:opacity-50"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="branchCode" className="text-sm font-medium text-slate-700">
                          Branch Code
                        </label>
                        <input
                          id="branchCode"
                          type="text"
                          placeholder="e.g. BLC/BRNCH/A"
                          value={branchCode}
                          onChange={(e) => { setBranchCode(e.target.value); setErrorMessage(''); }}
                          disabled={isPending}
                          className="w-full h-12 px-4 text-lg border border-slate-200 rounded-xl outline-none transition focus:border-[#1d4ed8] focus:ring-4 focus:ring-blue-100 text-slate-900 placeholder:text-slate-300 disabled:opacity-50 uppercase placeholder:normal-case"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <label htmlFor="code" className="text-sm font-medium text-slate-700">
                        Partner Code
                      </label>
                      <input
                        id="code"
                        type="text"
                        placeholder="PT-AZA/ABC/0001"
                        value={code}
                        onChange={(e) => { setCode(e.target.value); setErrorMessage(''); }}
                        disabled={isPending}
                        className="w-full h-12 px-4 text-lg border border-slate-200 rounded-xl outline-none transition focus:border-[#1d4ed8] focus:ring-4 focus:ring-blue-100 text-slate-900 placeholder:text-slate-300 disabled:opacity-50"
                      />
                    </div>
                  )}

                  {errorMessage && (
                    <p className="text-sm text-red-500">{errorMessage}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isPending || !canSubmit}
                    className="w-full h-12 bg-[#0d1b3d] hover:bg-[#0d1b3d]/90 text-white font-medium text-base rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isPending ? 'Sending OTP…' : 'Log in'}
                    {!isPending && <i className="ri-arrow-right-line text-base" />}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
