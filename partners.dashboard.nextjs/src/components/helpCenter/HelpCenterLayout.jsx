import { helpData } from "./data";
import DropdownUi from "./DropdownUi";

export default function HelpCenterLayout() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {helpData.map((section, index) => {
        const Icon = section.icon; // direct React component reference

        return (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Icon className="w-5 h-5 text-orange-500" />
              {section.header}
            </h2>

            <ul className="divide-y divide-gray-100">
              {section.items.map((item, idx) => (
                <li key={idx} className="py-3">
                  <DropdownUi
                    itemTopic={item.itemTopic}
                    itemInfo={item.itemInfo}
                  />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
