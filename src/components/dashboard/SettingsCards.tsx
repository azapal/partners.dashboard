import { sheetActions } from "../../store/client/sheets";

interface SettingsItem {
  title: string;
  description?: string;
  icon?: string;
  path?: any;
}

interface SettingsCardsProps {
  children: SettingsItem[];
  header?: string;
}

export const SettingsCards = ({ ...props }: SettingsCardsProps) => {
  function handleClick(item: string) {
    if (item?.toLowerCase() === "logout") location.href = "/LogoutScreen";
    else if (item?.toLowerCase() === "account information") handleToggle(item, "accountView");
    else if (item?.toLowerCase() === "business information") handleToggle(item, "businessInfo");
    else if (item?.toLowerCase() === "notification preferences") handleToggle(item, "notificationPreference");
    else if (item?.toLowerCase() === "user management") handleToggle(item, "userManagement");
  }

  function handleToggle(value?: string, modalName?: string) {
    sheetActions.toggleBasicResizableSheet({ name: modalName, show: true, props: { title: value } });
  }

  const isLogout = props.header?.toLowerCase() === "logout";

  return (
    <div className="w-full mb-4">
      <p className={`text-[11px] font-semibold uppercase tracking-widest px-1 mb-2 ${isLogout ? "text-red-400" : "text-gray-400"}`}>
        {props.header}
      </p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {props.children.map((item, index) => {
          const isLast = index === props.children.length - 1;
          const isLogoutItem = item.title?.toLowerCase() === "logout";

          return (
            <div
              key={index}
              onClick={() => handleClick(item.title)}
              className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors
                ${isLogoutItem ? "hover:bg-red-50" : "hover:bg-gray-50"}
                ${!isLast ? "border-b border-gray-50" : ""}
              `}
            >
              {/* Icon box */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                ${isLogoutItem ? "bg-red-50" : "bg-gray-50"}`}
              >
                <img
                  src={item.icon}
                  alt=""
                  className={`w-4 h-4 ${isLogoutItem ? "opacity-70" : "opacity-60"}`}
                />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${isLogoutItem ? "text-red-500" : "text-gray-800"}`}>
                  {item.title}
                </p>
                {item.description && (
                  <p className="text-[11px] text-gray-400 truncate">{item.description}</p>
                )}
              </div>

              {/* Chevron */}
              {!isLogoutItem && (
                <i className="ri-arrow-right-s-line text-gray-300 text-lg shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
