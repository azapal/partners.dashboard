import React, { useState } from 'react';
import { GitBranch, ArrowRight, ChevronLeft, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export function Stepped() {
  const [step, setStep] = useState(0);
  const [accountType, setAccountType] = useState<'partner' | 'branch' | null>(null);
  const [code, setCode] = useState('');

  const handleSelect = (type: 'partner' | 'branch') => {
    setAccountType(type);
    setStep(1);
  };

  const handleBack = () => {
    setStep(0);
    setAccountType(null);
    setCode('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <Card className="w-full max-w-md bg-white shadow-xl border-slate-200 overflow-hidden relative">
        <div 
          className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#F14724] to-[#8B2915]"
        />
        
        <CardContent className="p-8 pt-10">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-[#0d1b3d] tracking-tight">Azapal</h1>
            <p className="text-sm text-slate-500 mt-1">Partner Portal</p>
          </div>

          <div className="relative overflow-hidden">
            {step === 0 ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-slate-800">Who are you?</h2>
                  <p className="text-sm text-slate-500 mt-1">Select your account type to continue.</p>
                </div>
                
                <div className="space-y-4">
                  <button
                    onClick={() => handleSelect('partner')}
                    className="w-full group text-left flex items-start p-5 rounded-xl border-2 border-slate-100 hover:border-[#1d4ed8] hover:bg-blue-50/50 transition-all duration-200"
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
                    onClick={() => handleSelect('branch')}
                    className="w-full group text-left flex items-start p-5 rounded-xl border-2 border-slate-100 hover:border-[#1d4ed8] hover:bg-blue-50/50 transition-all duration-200"
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
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <button 
                  onClick={handleBack}
                  className="flex items-center text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6 -ml-2 p-2 rounded-md hover:bg-slate-100"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </button>
                
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-slate-800 flex items-center">
                    {accountType === 'partner' ? 'Partner Login' : 'Branch Login'}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Enter your access code to authenticate.</p>
                </div>
                
                <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-slate-700">Access Code</Label>
                    <Input 
                      id="code" 
                      type="password" 
                      placeholder="••••••••" 
                      className="h-12 text-lg border-slate-200 focus:border-[#1d4ed8] focus:ring-[#1d4ed8]"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-[#0d1b3d] hover:bg-[#0d1b3d]/90 text-white font-medium text-base shadow-md"
                  >
                    Log In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}