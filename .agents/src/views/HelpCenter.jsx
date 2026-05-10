import { Link } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import HelpCenterLayout from "../components/helpCenter/HelpCenterLayout";

export default function HelpCenter() {
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
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">Help Center</h1>
          <p className="text-gray-500">Find answers to common questions</p>
        </div>

        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          <input
            type="search"
            placeholder="Search for help articles..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <main className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <HelpCenterLayout />
        </main>
      </div>
    </div>
  );
}
