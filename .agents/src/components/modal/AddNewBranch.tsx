import { useState } from "react";
import Select from "react-select";
import { DefaultTextInput } from "../inputs/DefaultTextInput";
import { DefaultButton } from "../buttons/DefaultButton";
import State from '../../utilities/states.json'

type AddNewBranchProps = {
    setShowAddBranch: (show: boolean) => void;
};

export const AddNewBranch = ({ setShowAddBranch }: AddNewBranchProps) => {
    const [selectedState, setSelectedState] = useState<any>(null);
    const [selectedLga, setSelectedLga] = useState<any>(null);
    const [formData, setFormData] = useState({
        branchName: '',
        address: '',
        latitude: '',
        longitude: '',
        contactPerson: '',
        contactPhone: '',
    });

    const state = State ? State : []

    const stateOptions = state.map((s) => ({
        value: s.name,
        label: s.name,
    }));

    const lgaOptions =
        selectedState && selectedState.value
            ? state
            .find((s) => s.name === selectedState.value)
            ?.lgas.map((l) => ({ value: l, label: l })) || []
            : [];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission
        console.log('Branch data:', { ...formData, state: selectedState, lga: selectedLga });
    };

    return (
        <div
            className="w-full h-screen fixed bg-black/80 flex items-center justify-center top-0 left-0 right-0 bottom-0 z-50 p-4 overflow-y-auto">
            <div className="flex flex-col lg:flex-row bg-white rounded-3xl border my-2 shadow-2xl max-w-6xl w-full">
                <div className="w-full lg:w-1/2 flex flex-col p-6 sm:p-8 lg:p-12">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Add New Branch</h1>
                        <p className="text-gray-600 mt-1">Enter the details below to create a new branch location.</p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="flex-grow space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="branchName">
                                Branch Name
                            </label>
                            <input
                                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-[#F14724] focus:outline-none focus:ring-1 focus:ring-[#F14724] sm:text-sm bg-white text-gray-900"
                                id="branchName" 
                                name="branchName" 
                                placeholder="e.g., Downtown Hub" 
                                required
                                type="text"
                                value={formData.branchName}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    State
                                </label>
                                <Select
                                    options={stateOptions}
                                    placeholder="Select a state..."
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                    value={selectedState}
                                    onChange={(option) => {
                                        setSelectedState(option);
                                        setSelectedLga(null);
                                    }}
                                    isClearable
                                    styles={{
                                        control: (base) => ({
                                            ...base,
                                            borderColor: '#d1d5db',
                                            '&:hover': { borderColor: '#F14724' },
                                            boxShadow: 'none',
                                        }),
                                    }}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Local Government
                                </label>
                                <Select
                                    options={lgaOptions}
                                    placeholder={selectedState ? "Select LGA..." : "Select state first"}
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                    value={selectedLga}
                                    onChange={setSelectedLga}
                                    isDisabled={!selectedState}
                                    isClearable
                                    styles={{
                                        control: (base) => ({
                                            ...base,
                                            borderColor: '#d1d5db',
                                            '&:hover': { borderColor: '#F14724' },
                                            boxShadow: 'none',
                                        }),
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="address">
                                Branch Address
                            </label>
                            <div className="relative">
                                <i className="ri-map-pin-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                <input
                                    className="block w-full appearance-none rounded-md border border-gray-300 pl-10 pr-3 py-2 placeholder-gray-400 shadow-sm focus:border-[#F14724] focus:outline-none focus:ring-1 focus:ring-[#F14724] sm:text-sm bg-white text-gray-900"
                                    id="address" 
                                    name="address"
                                    placeholder="Search for an address or drop a pin on the map" 
                                    required
                                    type="text"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="latitude">
                                    Latitude
                                </label>
                                <input
                                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-[#F14724] focus:outline-none focus:ring-1 focus:ring-[#F14724] sm:text-sm bg-gray-100 text-gray-500"
                                    disabled
                                    id="latitude" 
                                    name="latitude" 
                                    placeholder="40.7128" 
                                    type="text"
                                    value={formData.latitude}
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="longitude">
                                    Longitude
                                </label>
                                <input
                                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-[#F14724] focus:outline-none focus:ring-1 focus:ring-[#F14724] sm:text-sm bg-gray-100 text-gray-500"
                                    disabled
                                    id="longitude" 
                                    name="longitude" 
                                    placeholder="-74.0060" 
                                    type="text"
                                    value={formData.longitude}
                                    readOnly
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="contactPerson">
                                Contact Person
                            </label>
                            <input
                                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-[#F14724] focus:outline-none focus:ring-1 focus:ring-[#F14724] sm:text-sm bg-white text-gray-900"
                                id="contactPerson" 
                                name="contactPerson" 
                                placeholder="e.g., Jane Doe" 
                                required
                                type="text"
                                value={formData.contactPerson}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="contactPhone">
                                Contact Phone
                            </label>
                            <input
                                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-[#F14724] focus:outline-none focus:ring-1 focus:ring-[#F14724] sm:text-sm bg-white text-gray-900"
                                id="contactPhone" 
                                name="contactPhone" 
                                placeholder="(555) 123-4567" 
                                required
                                type="tel"
                                value={formData.contactPhone}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-end gap-4">
                            <button 
                                onClick={() => setShowAddBranch(false)}
                                className="rounded-md bg-white border border-gray-300 py-2 px-6 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#F14724] focus:ring-offset-2 transition-colors"
                                type="button"
                            >
                                Cancel
                            </button>
                            <button
                                className="inline-flex justify-center rounded-md border border-transparent bg-[#F14724] py-2 px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#d63d1e] focus:outline-none focus:ring-2 focus:ring-[#F14724] focus:ring-offset-2 transition-colors"
                                type="submit"
                            >
                                Save Branch
                            </button>
                        </div>
                    </form>
                </div>
                
                <div className="w-full lg:w-1/2 h-96 lg:h-auto rounded-b-3xl lg:rounded-r-3xl lg:rounded-bl-none overflow-hidden">
                    <img 
                        alt="Interactive map showing a pin for the new branch location"
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8OXlsyEFJcCTDXOxwL8jCmDvohHuImYQo11sfh53fwUaGlOqbirCmm7ywggitIASA0Q9ptxAp6t-gsGbpMqK4cHkjfhbmkmsE5PgTk7QuQMJ5kBxxTIZxNPKYPUs28HySgWAiAJmztDSoGXCIzSci46hv79rn5A4kSlbheY8sU8gUpzmIVfxXW5_D2zxXh5UBSZ4NeK8g70W2vXDWVeNe0A0dCEZqop-kEsqKDQ1RW30rRWMQLzD2QixQDfHTpVU_XtkgbPYmEkc"
                    />
                </div>
            </div>
        </div>
    );
};
