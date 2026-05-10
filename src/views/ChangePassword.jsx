import { Link } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";

export default function ChangePassword() {
  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <Link to="/Settings">
            <div className="flex items-center gap-3">
              <button className="text-gray-600 hover:text-blue-600 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
            </div>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Change Password</h1>
          <p className="text-gray-500">Update your account password</p>
        </div>

        <form className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              placeholder="Enter current password"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              placeholder="Enter new password"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Re-enter new password"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 text-white px-5 py-2 rounded-xl font-medium hover:opacity-90 transition"
            >
              <Lock className="w-4 h-4" />
              Update Password
            </button>

            <button
              type="button"
              className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
