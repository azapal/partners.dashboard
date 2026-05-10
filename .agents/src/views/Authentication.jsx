import { Link } from "react-router-dom";
import { Lock, ShieldCheck, KeyRound, CheckCircle2, ArrowLeft } from "lucide-react";

const authData = [
  {
    icon: <ShieldCheck className="w-6 h-6 text-blue-600" />,
    title: "Enhanced Security",
    info: "Protect your account from unauthorized access.",
  },
  {
    icon: <KeyRound className="w-6 h-6 text-green-600" />,
    title: "Prevent Account Takeover",
    info: "Even if your password is compromised, your account stays safe.",
  },
  {
    icon: <CheckCircle2 className="w-6 h-6 text-purple-600" />,
    title: "Industry Standard",
    info: "Meets global security compliance requirements.",
  },
];

function AuthData({ item }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition">
      <div>{item.icon}</div>
      <div>
        <h3 className="text-gray-900 font-medium">{item.title}</h3>
        <p className="text-gray-500 text-sm">{item.info}</p>
      </div>
    </div>
  );
}

export default function Authentication() {
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
          <h1 className="text-2xl font-semibold text-gray-900">Two-Factor Authentication</h1>
          <p className="text-gray-500">
            Add an extra layer of security to your account.
          </p>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-7 h-7 text-blue-600" />
            <div>
              <h3 className="text-gray-900 font-medium">2FA Status</h3>
              <p className="text-gray-500 text-sm">Disabled</p>
            </div>
          </div>
          <button className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition">
            Enable 2FA
          </button>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Why enable 2FA?</h2>
          <ul className="space-y-4">
            {authData.map((item, index) => (
              <li key={index}>
                <AuthData item={item} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
