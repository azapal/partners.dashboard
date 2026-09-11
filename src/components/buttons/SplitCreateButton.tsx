import { useState } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';

interface SplitCreateButtonProps {
  label: string;
  icon?: string;
  onClick: () => void;
  bulkLabel: string;
  bulkIcon?: string;
  onBulkClick: () => void;
}

export function SplitCreateButton({
  label,
  icon = 'ri-add-line',
  onClick,
  bulkLabel,
  bulkIcon = 'ri-file-upload-line',
  onBulkClick,
}: SplitCreateButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));

  return (
    <div className="relative flex items-stretch shrink-0" ref={ref}>
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 h-11 bg-brand text-white pl-5 pr-4 rounded-l-xl text-sm font-semibold hover:bg-brand-hover transition-colors"
      >
        <i className={`${icon} text-base`} />
        {label}
      </button>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`More ${label.toLowerCase()} options`}
        className="flex items-center h-11 px-2.5 bg-brand text-white rounded-r-xl border-l border-white/25 hover:bg-brand-hover transition-colors"
      >
        <i className={`ri-arrow-${open ? 'up' : 'down'}-s-line text-base`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-10">
          <button
            type="button"
            onClick={() => { setOpen(false); onBulkClick(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
          >
            <i className={`${bulkIcon} text-base text-gray-400`} />
            {bulkLabel}
          </button>
        </div>
      )}
    </div>
  );
}
