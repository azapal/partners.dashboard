import React, { useState } from "react";
import { DoorOpen, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LogoutView() {
  const [isOpen, setIsOpen] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      console.log("User logged out successfully");
      setIsOpen(false);
      navigate("/");
    }, 800);
  };

  const handleCancel = () => {
    setIsOpen(false);
    console.log("Logout cancelled, returning to dashboard");
    navigate("/settings");
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
            className="absolute top-4 right-4 cursor-pointer text-gray-400 hover:text-gray-600 active:text-gray-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
            disabled={isLoggingOut}
          >
            <X className="w-6 h-6" />
          </button>

          <div className="p-6 sm:p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-black/10 flex items-center justify-center">
                <DoorOpen
                  className="w-10 h-10 sm:w-12 sm:h-12 text-black"
                  strokeWidth={2}
                />
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
                className="w-full hover:bg-black/70  hover:text-white cursor-pointer font-medium text-base sm:text-lg py-4 px-6 rounded-full disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
              >
                {isLoggingOut ? "Logging Out..." : "Log Out"}
              </button>

              <button
                onClick={handleCancel}
                disabled={isLoggingOut}
                className="w-full bg-white border-2 cursor-pointer border-gray-400 text-gray-800 font-medium text-base sm:text-lg py-4 px-6 rounded-full hover:bg-gray-50 hover:border-gray-500 active:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
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
