import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Key } from 'lucide-react';

export function CodeFirst() {
  const [accountType, setAccountType] = useState<'partner' | 'branch'>('partner');
  const [code, setCode] = useState('');

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4 font-sans">
      <Card className="w-full max-w-md border-gray-200 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardContent className="p-8 md:p-10 flex flex-col items-center">
          
          {/* Logo or Brand Mark */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F14724] to-[#8B2915] flex items-center justify-center mb-8">
            <Key className="text-white w-6 h-6" />
          </div>

          {/* Type Switcher */}
          <div className="flex bg-gray-100 p-1 rounded-full w-full mb-8">
            <button
              onClick={() => setAccountType('partner')}
              className={`flex-1 text-sm font-medium py-2 rounded-full transition-all ${
                accountType === 'partner' 
                  ? 'bg-[#1d4ed8] text-white shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Partner
            </button>
            <button
              onClick={() => setAccountType('branch')}
              className={`flex-1 text-sm font-medium py-2 rounded-full transition-all ${
                accountType === 'branch' 
                  ? 'bg-[#1d4ed8] text-white shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Partner Branch
            </button>
          </div>

          {/* Heading */}
          <div className="text-center mb-8 w-full">
            <h1 className="text-2xl md:text-3xl font-semibold text-[#0d1b3d] mb-2 tracking-tight">
              Enter your access code.
            </h1>
            <p className="text-gray-500 text-sm">
              Please enter the code provided to your {accountType === 'partner' ? 'company' : 'branch'}.
            </p>
          </div>

          {/* Input Area */}
          <div className="w-full mb-6">
            <div className="relative">
              <Input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="PTNR-XXXXX"
                className="w-full text-center text-3xl font-mono tracking-wider py-8 h-20 bg-gray-50 border-gray-200 focus-visible:ring-[#1d4ed8] focus-visible:border-transparent rounded-xl transition-all uppercase placeholder:text-gray-300 placeholder:font-sans placeholder:tracking-normal"
              />
            </div>
          </div>

          {/* CTA */}
          <Button 
            className="w-full h-14 text-base font-semibold rounded-xl bg-[#0d1b3d] hover:bg-[#1d4ed8] transition-colors flex items-center justify-center gap-2"
          >
            Access Portal
            <ArrowRight className="w-5 h-5" />
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}
