import { useNavigate } from "react-router-dom";
import { sheetActions } from "../../store/client/sheets";

interface SettingsItem {
  title: string;
  description?: string;
  icon?: string;
  path?: string;
}

interface SettingsCardsProps {
  children: SettingsItem[];
  header?: string;
}

const SHEET_BY_TITLE: Record<string, string> = {
  "business information": "businessInfo",
};

export const SettingsCards = ({ ...props }: SettingsCardsProps) => {
  const navigate = useNavigate();

  function handleClick(item: SettingsItem) {
    const key = item.title?.toLowerCase();
    const sheetName = SHEET_BY_TITLE[key];
    if (sheetName) {
      sheetActions.toggleBasicResizableSheet({ name: sheetName, show: true, props: { title: item.title } });
    } else if (item.path) {
      navigate(item.path);
    }
  }

  return (
    <div className="w-full mb-4">
      {props.header && (
        <p className="text-[11px] font-semibold uppercase tracking-widest px-1 mb-2 text-gray-400">
          {props.header}
        </p>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {props.children.map((item, index) => {
          const isLast = index === props.children.length - 1;

          return (
            <div
              key={index}
              onClick={() => handleClick(item)}
              className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-gray-50
                ${!isLast ? "border-b border-gray-50" : ""}
              `}
            >
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                <i className={`${item.icon} text-base text-gray-500`} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-800">{item.title}</p>
                {item.description && (
                  <p className="text-[11px] text-gray-400 truncate">{item.description}</p>
                )}
              </div>

              <i className="ri-arrow-right-s-line text-gray-300 text-lg shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
