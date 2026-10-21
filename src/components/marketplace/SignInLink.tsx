import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { rememberReturnTo } from "../../lib/returnTo";

/**
 * Every "Sign in to …" on the public network pages. Goes to the partner login
 * at `/`, remembering this page so the OTP screen can bring the visitor back.
 */
export const SignInLink = ({ children, className }: { children: ReactNode; className?: string }) => {
  const { pathname, search } = useLocation();
  return (
    <Link to="/" onClick={() => rememberReturnTo(`${pathname}${search}`)} className={className}>
      {children}
    </Link>
  );
};
