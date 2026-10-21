/**
 * Where to land after signing in, when sign-in was started from a public page
 * (the marketplace, briefs or routes board). Only those paths are accepted, so
 * a crafted value can't turn the login into an open redirect.
 */
const KEY = "azapal-return-to";
const ALLOWED = /^\/(marketplace|job-briefs|pairing-routes|inbox)(\/[\w-]*)?(\?[\w=&%.-]*)?$/;

export const rememberReturnTo = (path: string) => {
  try {
    if (ALLOWED.test(path)) sessionStorage.setItem(KEY, path);
  } catch {
    // storage blocked — signing in still works, it just lands on the default
  }
};

export const takeReturnTo = (): string | null => {
  try {
    const path = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return path && ALLOWED.test(path) ? path : null;
  } catch {
    return null;
  }
};
