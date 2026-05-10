import { useState } from 'react';
import { GitBranch, ArrowRight, ChevronLeft, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LoginScreen = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<0 | 1>(0);
  const [accountType, setAccountType] = useState<'PARTNERS' | 'PARTNERS BRANCH' | null>(null);
  const [code, setCode] = useState('');

  const handleSelect = (type: 'PARTNERS' | 'PARTNERS BRANCH') => {
    setAccountType(type);
    setStep(1);
  };

  const handleBack = () => {
    setStep(0);
    setAccountType(null);
    setCode('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/login/otp');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white shadow-xl border border-slate-200 rounded-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#F14724] to-[#8B2915]" />

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
                      <Building2 className="h-5 w-5" />
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
                      <GitBranch className="h-5 w-5" />
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
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </button>

                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-slate-800">
                    {accountType === 'PARTNERS' ? 'Partner Login' : 'Branch Login'}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Enter your access code to authenticate.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="code" className="text-sm font-medium text-slate-700">
                      {accountType === 'PARTNERS' ? 'Partner Code' : 'Branch Code'}
                    </label>
                    <input
                      id="code"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="off"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full h-12 px-4 text-lg border border-slate-200 rounded-xl outline-none transition focus:border-[#1d4ed8] focus:ring-4 focus:ring-blue-100 text-slate-900 placeholder:text-slate-300"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-12 bg-[#0d1b3d] hover:bg-[#0d1b3d]/90 text-white font-medium text-base rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                  >
                    Log in
                    <ArrowRight className="h-4 w-4" />
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
