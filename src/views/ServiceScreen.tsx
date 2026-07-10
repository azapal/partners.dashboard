import { useEffect, useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useGetServices, useGetPartnerServices, useUpdatePartnerServices } from '../hooks/useServices';
import type { ServiceOption } from '../service/partnerService';
import { SearchableSelect } from '../components/inputs/SearchableSelect';

type Responses = Record<number, string | string[]>;

export const ServiceScreen = () => {
  const { data: services = [], isLoading } = useGetServices();
  const { data: partnerServices, isLoading: isLoadingSelection } = useGetPartnerServices();
  const updatePartnerServices = useUpdatePartnerServices();

  const [openId, setOpenId] = useState<number | null>(null);
  const [responses, setResponses] = useState<Responses>({});
  const [showPicker, setShowPicker] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (partnerServices) setSelectedIds(partnerServices.map((s) => s.id));
  }, [partnerServices]);

  const toggleSelected = (id: number) => {
    setSaveState('idle');
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const saveSelection = () => {
    updatePartnerServices.mutate(selectedIds, {
      onSuccess: () => setSaveState('saved'),
      onError: () => setSaveState('error'),
    });
  };

  const activeServices = services.filter((s) => s.is_active);

  const toggle = (id: number) =>
    setOpenId((prev) => (prev === id ? null : id));

  const setCheckbox = (optionId: number, value: string) => {
    setResponses((prev) => {
      const current = (prev[optionId] as string[] | undefined) ?? [];
      return {
        ...prev,
        [optionId]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      };
    });
  };

  const setTextValue = (optionId: number, value: string) =>
    setResponses((prev) => ({ ...prev, [optionId]: value }));

  const handleNext = (currentId: number) => {
    const idx = activeServices.findIndex((s) => s.id === currentId);
    if (idx < activeServices.length - 1) {
      setOpenId(activeServices[idx + 1].id);
    }
  };

  const handleSubmit = () => {
    console.log('Service responses:', responses);
  };

  const renderOption = (opt: ServiceOption) => {
    if (opt.element_type === 'checkbox' && opt.contents.length > 0) {
      const selected = (responses[opt.id] as string[] | undefined) ?? [];
      return (
        <div key={opt.id} className="space-y-2">
          {opt.label && (
            <p className="text-sm font-medium text-gray-700">{opt.label}</p>
          )}
          <div className="grid sm:grid-cols-2 gap-1">
            {[...opt.contents]
              .sort((a, b) => a.order - b.order)
              .map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-xl hover:bg-orange-50/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(c.value)}
                    onChange={() => setCheckbox(opt.id, c.value)}
                    className="w-4 h-4 rounded accent-[#F14724] shrink-0"
                  />
                  <span className="text-sm text-gray-700">{c.display_text}</span>
                </label>
              ))}
          </div>
        </div>
      );
    }

    if (opt.element_type === 'select_dropdown') {
      const sortedContents = [...opt.contents].sort((a, b) => a.order - b.order);
      return (
        <div key={opt.id}>
          <SearchableSelect
            label={
              opt.required && opt.label ? `${opt.label} *` : opt.label ?? ''
            }
            options={sortedContents.map((c) => ({
              label: c.display_text,
              value: c.value,
            }))}
            value={(responses[opt.id] as string | undefined) ?? ''}
            onChange={(value) => setTextValue(opt.id, value)}
            placeholder={opt.placeholder ?? 'Search…'}
          />
        </div>
      );
    }

    if (opt.element_type === 'text_input') {
      return (
        <div key={opt.id} className="space-y-1.5">
          {opt.label && (
            <label className="block text-sm font-medium text-gray-700">
              {opt.label}
              {opt.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
          )}
          <textarea
            value={(responses[opt.id] as string | undefined) ?? ''}
            onChange={(e) => setTextValue(opt.id, e.target.value)}
            placeholder={opt.placeholder ?? 'Enter your response…'}
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-[#F14724] resize-none"
          />
        </div>
      );
    }

    // Fallback for unknown element types
    return (
      <div key={opt.id} className="space-y-1.5">
        {opt.label && (
          <label className="block text-sm font-medium text-gray-700">
            {opt.label}
            {opt.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <input
          type="text"
          value={(responses[opt.id] as string | undefined) ?? ''}
          onChange={(e) => setTextValue(opt.id, e.target.value)}
          placeholder={opt.placeholder ?? ''}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-[#F14724]"
        />
      </div>
    );
  };

  const currentIdx = activeServices.findIndex((s) => s.id === openId);
  const progress = currentIdx >= 0
    ? Math.round(((currentIdx + 1) / activeServices.length) * 100)
    : 0;

  return (
    <DashboardLayout>
      <div className="w-full flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Services</h1>
            <p className="text-sm text-slate-500 mt-1">
              Complete your service details for customer reference.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPicker((prev) => !prev)}
            className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors shrink-0"
          >
            <i className="ri-list-check-2 text-base" />
            <span className="hidden sm:inline">Manage Services</span>
          </button>
        </div>

        {showPicker && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-800 mb-1">Select the services you offer</p>
            <p className="text-xs text-gray-400 mb-4">
              Only selected services will be shown to customers.
            </p>

            {isLoadingSelection ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-11 rounded-lg bg-gray-50 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-1 mb-4">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                      service.is_active
                        ? 'cursor-pointer hover:bg-orange-50/50'
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(service.id)}
                      disabled={!service.is_active}
                      onChange={() => toggleSelected(service.id)}
                      className="w-4 h-4 rounded accent-[#F14724] shrink-0"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-gray-700">{service.name}</span>
                      {service.description && (
                        <span className="block text-xs text-gray-400 truncate">{service.description}</span>
                      )}
                    </span>
                    {!service.is_active && (
                      <span className="text-[10px] font-semibold text-gray-400 shrink-0">Inactive</span>
                    )}
                  </label>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={saveSelection}
                disabled={updatePartnerServices.isPending}
                className="flex items-center gap-2 bg-[#F14724] hover:bg-[#d63d1e] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {updatePartnerServices.isPending ? (
                  <i className="ri-loader-4-line animate-spin text-base" />
                ) : (
                  <i className="ri-check-line text-base" />
                )}
                Save Selection
              </button>
              {saveState === 'saved' && (
                <span className="text-xs font-medium text-green-600">Saved.</span>
              )}
              {saveState === 'error' && (
                <span className="text-xs font-medium text-red-500">Couldn't save. Try again.</span>
              )}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 h-16 animate-pulse"
              />
            ))}
          </div>
        ) : activeServices.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <i className="ri-service-line text-3xl text-gray-300" />
            <p className="text-sm text-gray-400 mt-2">No services available yet.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {activeServices.map((service, idx) => {
                const isOpen = openId === service.id;
                const isLast = idx === activeServices.length - 1;

                return (
                  <div
                    key={service.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                  >
                    {/* Header */}
                    <button
                      type="button"
                      onClick={() => toggle(service.id)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-orange-50/40 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                          <i className="ri-settings-3-line text-base text-[#F14724]" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{service.name}</p>
                          {service.description && (
                            <p className="text-xs text-gray-400 mt-0.5">{service.description}</p>
                          )}
                        </div>
                      </div>
                      <i
                        className={`ri-arrow-${isOpen ? 'up' : 'down'}-s-line text-lg text-gray-400 shrink-0 ml-4`}
                      />
                    </button>

                    {/* Body */}
                    {isOpen && (
                      <div className="px-5 pb-5 border-t border-gray-50">
                        <div className="pt-4 space-y-5">
                          {[...service.options]
                            .sort((a, b) => a.order - b.order)
                            .map((opt) => renderOption(opt))}
                        </div>

                        <div className="flex justify-end mt-6">
                          {!isLast ? (
                            <button
                              type="button"
                              onClick={() => handleNext(service.id)}
                              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                            >
                              Next
                              <i className="ri-arrow-right-line text-base" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSubmit}
                              className="flex items-center gap-2 bg-[#F14724] hover:bg-[#d63d1e] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                            >
                              <i className="ri-check-line text-base" />
                              Submit
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            {currentIdx >= 0 && (
              <div className="flex items-center justify-between text-sm text-gray-500 pb-2">
                <span>
                  Section {currentIdx + 1} of {activeServices.length}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-36 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#F14724] rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[#F14724] font-medium">{progress}%</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};
