import { ReactNode } from "react";

export const AuthLayout = ({ children }: { children: ReactNode }) => {
        return (
                <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
                        <div className="grid min-h-screen lg:grid-cols-[1.15fr_0.85fr]">
                                <div className="relative hidden overflow-hidden lg:flex flex-col justify-between p-10 xl:p-14 text-white bg-gradient-to-br from-[#0d1b3d] via-[#142449] to-[#091225]">
                                        <div className="absolute inset-0 opacity-35 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.45),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.2),_transparent_30%)]" />
                                        <img
                                                src="@assets/Screenshot_2026-05-05_at_18.03.26_1778000624311.png"
                                                alt="Partner onboarding preview"
                                                className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-screen"
                                        />
                                        <div className="relative z-10">
                                                <img
                                                        src="/azapallogoV1.svg"
                                                        alt="logo"
                                                        className="h-8 w-auto"
                                                />
                                        </div>
                                        <div className="relative z-10 max-w-xl space-y-4">
                                                <p className="text-4xl font-semibold leading-tight">
                                                        Seamless partner
                                                        onboarding and login
                                                </p>
                                                <p className="max-w-lg text-sm leading-6 text-blue-100/80">
                                                        A clean, secure flow for
                                                        login, onboarding, and
                                                        OTP verification built
                                                        around the current brand
                                                        colors.
                                                </p>
                                        </div>
                                </div>
                                <div className="flex items-center justify-center px-4 py-10 sm:px-8">
                                        <div className="w-full max-w-md rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.12)] backdrop-blur">
                                                <div className="mb-8 flex items-center gap-3 lg:hidden">
                                                        <img
                                                                src="/azapallogoV1.svg"
                                                                alt="logo"
                                                                className="h-8 w-auto"
                                                        />
                                                </div>
                                                {children}
                                        </div>
                                </div>
                        </div>
                </div>
        );
};
