import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Immersive() {
  const [accountType, setAccountType] = useState<"partner" | "branch">("partner");
  const [accessCode, setAccessCode] = useState("");

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden font-sans" style={{ background: "linear-gradient(135deg, #0d1b3d 0%, #050d1f 100%)" }}>
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-800/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Logo */}
      <div className="z-10 mb-8 flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-[#F14724] to-[#8B2915] flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-lg leading-none">A</span>
        </div>
        <span className="text-white text-2xl font-semibold tracking-wide">Azapal</span>
      </div>

      {/* Glass Card */}
      <div 
        className="z-10 w-full max-w-md p-8 rounded-2xl bg-white/10 border border-white/15 shadow-2xl flex flex-col gap-8"
        style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      >
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-medium text-white tracking-tight">Welcome back</h1>
          <p className="text-blue-200/60 text-sm">Sign in to your partner portal</p>
        </div>

        <div className="space-y-6">
          {/* Account Type Toggle */}
          <div className="flex p-1 rounded-xl bg-black/20 border border-white/5">
            <button
              onClick={() => setAccountType("partner")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ease-out ${
                accountType === "partner" 
                  ? "bg-white/15 text-white shadow-sm border border-white/10" 
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              Partner
            </button>
            <button
              onClick={() => setAccountType("branch")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ease-out ${
                accountType === "branch" 
                  ? "bg-white/15 text-white shadow-sm border border-white/10" 
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              Partner Branch
            </button>
          </div>

          {/* Access Code Input */}
          <div className="space-y-2">
            <Label htmlFor="code" className="text-white/70 text-sm">Access Code</Label>
            <div className="relative group">
              <Input
                id="code"
                type="password"
                placeholder="Enter your access code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full h-12 bg-black/20 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all rounded-xl pl-4 pr-10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-blue-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[#F14724] to-[#8B2915] hover:opacity-90 text-white font-medium text-base shadow-lg shadow-orange-900/20 transition-opacity border-0"
          >
            Sign In
          </Button>
        </div>
        
        <div className="text-center">
          <a href="#" className="text-sm text-white/40 hover:text-white transition-colors">
            Need help accessing your account?
          </a>
        </div>
      </div>
    </div>
  );
}
