import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "../service/partnerService";

export default function LogoutView() {
  const [isOpen, setIsOpen] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  // This used to wait and navigate to "/" without clearing anything, so the
  // session survived and the login screen sent the user straight back in.
  const handleLogout = () => {
    setIsLoggingOut(true);
    signOut();
  };

  const handleCancel = () => {
    setIsOpen(false);
    // Back to wherever they came from; the dashboard if they arrived directly.
    if (window.history.length > 1) navigate(-1);
    else navigate("/dashboard");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 backdrop-blur-sm"
        style={{ backgroundColor: "rgba(253, 249, 243, 0.8)" }}
        onClick={handleCancel}
      />

     
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl  shadow-2xl w-full max-w-md relative">
       
          <button
            onClick={handleCancel}
            aria-label="Close"
            className="absolute top-4 right-4 cursor-pointer text-gray-400 hover:text-gray-600 active:text-gray-800 min-h-11 min-w-11 flex items-center justify-center"
            disabled={isLoggingOut}
          >
            <i className="ri-close-line text-xl" />
          </button>

          <div className="p-6 sm:p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-orange-100 flex items-center justify-center">
                <i className="ri-logout-box-r-line text-4xl sm:text-5xl text-brand" />
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-3 leading-snug px-2">
              Are you sure you want to log out?
            </h2>

            <p className="text-base sm:text-lg text-gray-600 mb-8 leading-relaxed px-2">
              You will need to sign in again to access your dashboard and
              business tools.
            </p>

            
            <div className="space-y-4">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full bg-brand text-white hover:bg-brand-hover cursor-pointer font-medium text-base sm:text-lg py-4 px-6 rounded-full disabled:opacity-60 disabled:cursor-not-allowed min-h-11"
              >
                {isLoggingOut ? "Logging Out..." : "Log Out"}
              </button>

              <button
                onClick={handleCancel}
                disabled={isLoggingOut}
                className="w-full bg-white border-2 cursor-pointer border-gray-400 text-gray-800 font-medium text-base sm:text-lg py-4 px-6 rounded-full hover:bg-gray-50 hover:border-gray-500 active:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed min-h-11"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        button:focus-visible {
          outline: 3px solid #2563eb;
          outline-offset: 2px;
        }
      `}</style>
    </>
  );
}
