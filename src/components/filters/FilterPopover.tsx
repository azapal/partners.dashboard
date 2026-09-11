import { useState, type ReactNode } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';

interface FilterPopoverProps {
  activeCount?: number;
  panelClassName?: string;
  children: (close: () => void) => ReactNode;
}

export function FilterPopover({ activeCount = 0, panelClassName = 'w-64', children }: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const close = () => setOpen(false);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center gap-1.5 h-11 px-3.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors"
      >
        <i className="ri-filter-3-line text-base" />
        Filter
        <i className={`ri-arrow-${open ? 'up' : 'down'}-s-line text-base text-gray-400`} />
        {activeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute left-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg z-10 p-3 ${panelClassName}`}>
          {children(close)}
        </div>
      )}
    </div>
  );
}
