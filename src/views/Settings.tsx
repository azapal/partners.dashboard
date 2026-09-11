import { useState, type FormEvent } from "react";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { SettingsCards } from "../components/dashboard/SettingsCards";
import { NotificationPreference } from "../components/modal/NotificationPreference";
import { FormField } from "../components/inputs/FormField";
import { usePartnerProfile, useUpdatePartnerProfile } from "../hooks/useAuth";
import { useRepProfile } from "../hooks/useRepAuth";
import config from "../../config/config";
import pkg from "../../package.json";

type Tab = "account" | "notifications" | "security" | "support" | "developer";

const WHY_2FA = [
  {
    icon: "ri-shield-check-line",
    iconColor: "text-blue-600",
    title: "Enhanced Security",
    info: "Protect your account from unauthorized access.",
  },
  {
    icon: "ri-key-2-line",
    iconColor: "text-green-600",
    title: "Prevent Account Takeover",
    info: "Even if your password is compromised, your account stays safe.",
  },
  {
    icon: "ri-checkbox-circle-line",
    iconColor: "text-purple-600",
    title: "Industry Standard",
    info: "Meets global security compliance requirements.",
  },
];

const NAV_ITEMS: { key: Tab; label: string; icon: string }[] = [
  { key: "account", label: "Account", icon: "ri-user-line" },
  { key: "notifications", label: "Notifications", icon: "ri-notification-3-line" },
  { key: "security", label: "Security", icon: "ri-shield-check-line" },
  { key: "support", label: "Support", icon: "ri-question-line" },
  { key: "developer", label: "Developer", icon: "ri-terminal-box-line" },
];

const TAB_ITEMS: Record<Exclude<Tab, "developer" | "account" | "security" | "notifications">, { title: string; description?: string; icon: string; path?: string }[]> = {
  support: [
    {
      title: "Help center",
      description: "Get help with your account",
      icon: "ri-question-line",
      path: "/helpCenter",
    },
    {
      title: "Contact support",
      description: "Contact support",
      icon: "ri-customer-service-2-line",
      path: "/contact",
    },
  ],
};

const inputClass = 'h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white w-full';

function AccountPanel() {
  const profile = usePartnerProfile();
  const repProfile = useRepProfile();
  const updateProfile = useUpdatePartnerProfile();

  // Editing the business's own registration details (name, HQ address, etc.)
  // stays an owner-only action — an employee, even Tenant Admin/Super Admin,
  // gets a read-only summary of the business they work for instead, using
  // whatever inviting_partner already carries (no fabricated fields).
  if (!profile && repProfile) {
    const partner = repProfile.inviting_partner;
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
        <p className="text-sm text-gray-500">
          You're signed in as an employee of this business — business registration details can
          only be changed by the partner-owner account.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-gray-700">Business name</p>
            <p className="h-11 px-3 flex items-center text-sm text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
              {partner?.partner_name ?? "—"}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-gray-700">Partner code</p>
            <p className="h-11 px-3 flex items-center text-sm text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
              {partner?.partner_code ?? "—"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const [name, setName] = useState(profile?.partner_name ?? "");
  const [email, setEmail] = useState(profile?.partner_email ?? "");
  const [address, setAddress] = useState(profile?.partner_hq_address ?? "");
  const [state, setState] = useState(profile?.partner_hq_state ?? "");
  const [city, setCity] = useState(profile?.partner_hq_city ?? "");
  const [country, setCountry] = useState(profile?.partner_country ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaved(false);

    updateProfile.mutate(
      {
        partner_name: name,
        partner_email: email,
        partner_hq_address: address,
        partner_hq_state: state,
        partner_hq_city: city,
        partner_country: country,
      },
      {
        onSuccess: () => setSaved(true),
        onError: (err) => setFormError(err.message),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-gray-700">Partner code</p>
          <p className="h-11 px-3 flex items-center text-sm text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
            {profile?.partner_code ?? "—"}
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-gray-700">Partner ID</p>
          <p className="h-11 px-3 flex items-center text-sm text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
            {profile?.partner_id ?? "—"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Business name">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </FormField>
        <FormField label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </FormField>
      </div>

      <FormField label="Address">
        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormField label="State">
          <input type="text" value={state} onChange={(e) => setState(e.target.value)} className={inputClass} />
        </FormField>
        <FormField label="City">
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
        </FormField>
        <FormField label="Country">
          <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} />
        </FormField>
      </div>

      {formError && <p className="text-xs text-red-500">{formError}</p>}

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={updateProfile.isPending}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {updateProfile.isPending && <i className="ri-loader-4-line animate-spin text-base" />}
          {updateProfile.isPending ? "Saving…" : "Save changes"}
        </button>
        {saved && !formError && <span className="text-xs font-medium text-green-600">Saved.</span>}
      </div>
    </form>
  );
}

function SecurityPanel() {
  return (
    <div className="flex flex-col gap-5">
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <i className="ri-lock-2-line text-xl text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Two-factor authentication</p>
            <p className="text-sm text-gray-500">Status: Disabled</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <button
            type="button"
            disabled
            className="bg-gray-100 text-gray-400 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-not-allowed"
          >
            Enable 2FA
          </button>
          <span className="text-[11px] text-gray-400">Coming soon</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-gray-700">Why enable 2FA?</h2>
        {WHY_2FA.map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-white shadow-sm"
          >
            <i className={`${item.icon} text-xl ${item.iconColor} shrink-0 mt-0.5`} />
            <div>
              <p className="text-sm font-medium text-gray-900">{item.title}</p>
              <p className="text-sm text-gray-500">{item.info}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeveloperPanel() {
  const profile = usePartnerProfile();
  const repProfile = useRepProfile();

  const rows: { label: string; value: string }[] = [
    { label: "App version", value: pkg.version || "—" },
    { label: "Environment", value: config.stage },
    { label: "API base URL", value: config.api.azapal.baseUrl },
    ...(profile
      ? [
          { label: "Partner ID", value: profile?.partner_id ?? String(profile?.id ?? "—") },
          { label: "Partner code", value: profile?.partner_code ?? "—" },
          {
            label: "Session expires",
            value: profile?.partner_token_expires_at
              ? new Date(profile.partner_token_expires_at).toLocaleString()
              : "—",
          },
        ]
      : repProfile
      ? [
          { label: "Signed in as", value: `${repProfile.first_name} ${repProfile.last_name}`.trim() },
          { label: "Role", value: repProfile.invite_role?.name ?? "—" },
          { label: "Partner code", value: repProfile.inviting_partner?.partner_code ?? "—" },
        ]
      : []),
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {rows.map((row, index) => (
        <div
          key={row.label}
          className={`flex items-center justify-between gap-3 px-4 py-3.5 ${
            index !== rows.length - 1 ? "border-b border-gray-50" : ""
          }`}
        >
          <p className="text-sm text-gray-500">{row.label}</p>
          <p className="text-sm font-medium text-gray-800 text-right break-all">{row.value}</p>
        </div>
      ))}
    </div>
  );
}

export const Settings = () => {
  const [tab, setTab] = useState<Tab>("account");

  return (
    <DashboardLayout>
      <div className="w-full flex flex-col gap-5 overflow-y-auto">
       

        {/* Mobile: horizontal pill nav */}
        <div className="md:hidden flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1 shadow-sm overflow-x-auto">
          {NAV_ITEMS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                tab === key ? "bg-brand text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <i className={`${icon} text-base`} />
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-5">
          {/* Desktop: vertical nav, styled as an extension of the main sidebar */}
          <nav className="hidden md:flex md:w-56 shrink-0 flex-col gap-0.5 h-fit">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-1">
              Settings
            </p>
            {NAV_ITEMS.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all duration-200 group ${
                  tab === key ? "bg-orange-50 text-brand" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`}
              >
                {tab === key && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-brand rounded-r-full" />
                )}
                <i className={`${icon} text-lg ${tab === key ? "text-brand" : "text-gray-400 group-hover:text-gray-700"}`} />
                {label}
              </button>
            ))}
          </nav>

          <div className="flex-1 min-w-0">
            {tab === "developer" ? (
              <DeveloperPanel />
            ) : tab === "account" ? (
              <AccountPanel />
            ) : tab === "security" ? (
              <SecurityPanel />
            ) : tab === "notifications" ? (
              <NotificationPreference />
            ) : (
              <SettingsCards children={TAB_ITEMS[tab]} />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
