import React from 'react';

interface SelectOption {
  label: string;
  value: string;
}

interface DefaultSelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  selectedValue: string;
}

export const DefaultSelectInput: React.FC<DefaultSelectInputProps> = ({ label, options, selectedValue, onChange, ...props }) => {
  return (
    <div className="flex flex-col space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value={selectedValue}
        onChange={onChange}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border border-gray-200 rounded-xl h-11.25 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white"
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
