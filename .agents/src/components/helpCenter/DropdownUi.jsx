import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function DropdownUi({ itemTopic, itemInfo }) {
  const [dropdownActive, setDropdownActive] = useState(false);

  return (
    <div>
      <button
        onClick={() => setDropdownActive(!dropdownActive)}
        className="w-full flex justify-between items-center text-left"
      >
        <p className="text-gray-800 font-medium">{itemTopic}</p>
        {dropdownActive ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {dropdownActive && (
        <p className="mt-2 text-gray-600 text-sm leading-relaxed transition-all duration-200 ease-in">
          {itemInfo}
        </p>
      )}
    </div>
  );
}
