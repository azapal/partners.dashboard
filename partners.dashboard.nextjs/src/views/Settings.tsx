import { DashboardLayout } from "../layouts/DashboardLayout";
import { SettingsCards } from "../components/dashboard/SettingsCards";
export const Settings = () => {
  return (
    <DashboardLayout>
      <main className="w-full flex flex-col overflow-y-scroll ">
        <div className="flex-1">
          {settingsActions.map((action, index) => (
            <SettingsCards key={index} {...action} />
          ))}
        </div>
      </main>
    </DashboardLayout>
  );
};

const settingsActions = [
  {
    header: "Account",
    children: [
      {
        title: "Account information",
        description: "Manage your account details",
        icon: "/icons/suitcase.svg",
        path: "/AccountView",
      },
      {
        title: "User Management",
        description: "Invite and Manage other people",
        icon: "/icons/person.svg",
        path: "/BusinessInfo",
      },
      // {
      //     title: "Payment methods",
      //     description:'Manage your payment methods',
      //     icon:'/icons/card.svg',
      //     path: '/PaymentMethod'
      // }
    ],
  },

  {
    header: "Notifications",
    children: [
      {
        title: "Notification preferences",
        description: "Manage your notification preferences",
        icon: "/icons/bell.svg",
      },
    ],
  },
  {
    header: "Security",
    children: [
      {
        title: "Change password",
        description: "Manage your password",
        icon: "/icons/lock2.svg",
        path: "/changePassword",
      },

      {
        title: "Two-factor authentication",
        description: "Manage your two-factor authentication",
        icon: "/icons/shield.svg",
        path: "/authentication",
      },
    ],
  },
  {
    header: "Support",
    children: [
      {
        title: "Help center",
        description: "Get help with your account",
        icon: "/icons/faq.svg",
        path: "/helpCenter",
      },
      {
        title: "Contact support",
        description: "Contact support",
        icon: "/icons/customer_care.svg",
        path: "/contact",
      },
    ],
  },
  {
    header: "Logout",
    children: [
      {
        title: "Logout",
        icon: "/icons/logout.svg",
        action: "logout",
        path: "/LogoutScreen",
      },
    ],
  },
];
