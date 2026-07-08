import { useState, useRef, useEffect } from 'react';

export interface SelectOption {
  label: string;
  value: string;
}

interface BaseProps {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
}

interface SingleProps extends BaseProps {
  multi?: false;
  value: string;
  onChange: (value: string) => void;
}

interface MultiProps extends BaseProps {
  multi: true;
  value: string[];
  onChange: (values: string[]) => void;
}

export type SearchableSelectProps = SingleProps | MultiProps;

export function SearchableSelect(props: SearchableSelectProps) {
  const { label, options, placeholder = 'Search…', loading, disabled } = props;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  // ── Multi select ──────────────────────────────────────────────────────────
  if (props.multi) {
    const { value: selected, onChange } = props;

    const toggle = (opt: SelectOption) => {
      onChange(
        selected.includes(opt.value)
          ? selected.filter((v) => v !== opt.value)
          : [...selected, opt.value]
      );
    };

    const remove = (v: string) => onChange(selected.filter((s) => s !== v));

    const selectedOpts = options.filter((o) => selected.includes(o.value));
    const unselectedFiltered = filtered.filter((o) => !selected.includes(o.value));

    return (
      <div ref={containerRef} className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>

        {/* Input area */}
        <div
          className={`min-h-11 rounded-xl border border-gray-200 bg-white px-3 py-2 flex flex-wrap gap-1.5 cursor-text transition-shadow ${
            open ? 'ring-2 ring-gray-200 border-gray-400' : ''
          } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
          onClick={() => { setOpen(true); inputRef.current?.focus(); }}
        >
          {selectedOpts.map((opt) => (
            <span
              key={opt.value}
              className="flex items-center gap-1 bg-orange-50 border border-orange-100 text-[#F14724] text-xs font-semibold px-2 py-0.5 rounded-lg"
            >
              {opt.label}
              <button
                type="button"
                aria-label={`Remove ${opt.label}`}
                onClick={(e) => { e.stopPropagation(); remove(opt.value); }}
                className="hover:text-red-600 transition-colors"
              >
                <i className="ri-close-line text-xs" />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={selected.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[100px] text-sm outline-none bg-transparent text-gray-800 placeholder:text-gray-400 py-0.5"
          />
        </div>

        {/* Dropdown */}
        {open && (
          <div className="relative">
            <ul className="absolute z-50 top-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg max-h-52 overflow-y-auto divide-y divide-gray-50">
              {loading ? (
                <li className="px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
                  <i className="ri-loader-4-line animate-spin" /> Loading…
                </li>
              ) : unselectedFiltered.length === 0 ? (
                <li className="px-4 py-3 text-sm text-gray-400">
                  {query ? 'No matching options' : 'All options selected'}
                </li>
              ) : (
                unselectedFiltered.map((opt) => (
                  <li
                    key={opt.value}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => toggle(opt)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50/60 cursor-pointer transition-colors"
                  >
                    <i className="ri-add-circle-line text-[#F14724] text-base shrink-0" />
                    {opt.label}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // ── Single select ─────────────────────────────────────────────────────────
  const { value, onChange } = props;
  const selectedOpt = options.find((o) => o.value === value);
  const displayValue = open ? query : (selectedOpt?.label ?? '');

  const handleSelect = (opt: SelectOption) => {
    onChange(opt.value);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>

      <div className={`relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div
          className={`flex items-center h-11 rounded-xl border border-gray-200 bg-white px-3 gap-2 transition-shadow ${
            open ? 'ring-2 ring-gray-200 border-gray-400' : ''
          }`}
        >
          <input
            type="text"
            value={displayValue}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => { setQuery(''); setOpen(true); }}
            onBlur={() => {
              // Restore label if user typed but didn't pick
              setTimeout(() => setQuery(''), 150);
            }}
            placeholder={placeholder}
            className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder:text-gray-400"
          />
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setOpen((prev) => !prev)}
            className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          >
            <i className={`ri-arrow-${open ? 'up' : 'down'}-s-line text-base`} />
          </button>
        </div>

        {open && (
          <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg max-h-52 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <li className="px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
                <i className="ri-loader-4-line animate-spin" /> Loading…
              </li>
            ) : filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400">No options found</li>
            ) : (
              filtered.map((opt) => (
                <li
                  key={opt.value}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(opt)}
                  className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                    opt.value === value
                      ? 'bg-orange-50 text-[#F14724] font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  {opt.value === value && (
                    <i className="ri-check-line text-base text-[#F14724]" />
                  )}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
