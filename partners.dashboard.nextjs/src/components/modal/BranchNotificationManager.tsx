import { useState } from 'react';
import { Building2, ChevronDown, ChevronUp, Plus } from 'lucide-react';

type Branch = {
    id: string;
    name: string;
    location: string;
    notificationChannel?: 'whatsapp' | 'sms' | 'email';
    contacts?: string[];
    orderNotificationTeam?: string[];
    paymentNotificationTeam?: string[];
};

type BranchNotificationManagerProps = {
    onAddBranch?: () => void;
};

// Mock branches - replace with actual data
const mockBranches: Branch[] = [
    { id: '1', name: 'Lagos Branch', location: 'Victoria Island, Lagos', notificationChannel: 'email', contacts: ['lagos@example.com', 'manager.lagos@example.com'] },
    { id: '2', name: 'Abuja Branch', location: 'Wuse 2, Abuja', notificationChannel: 'whatsapp', contacts: ['+234 123 456 7890', '+234 098 765 4321'] },
    { id: '3', name: 'Port Harcourt Branch', location: 'GRA, Port Harcourt' },
];

export const BranchNotificationManager = ({ onAddBranch }: BranchNotificationManagerProps) => {
    const [expandedBranch, setExpandedBranch] = useState<string | null>(null);

    const toggleBranch = (branchId: string) => {
        setExpandedBranch(expandedBranch === branchId ? null : branchId);
    };

    return (
        <div className="mt-8 p-6 bg-white border-2 border-gray-200 rounded-xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-gray-700" />
                    <h3 className="text-lg font-semibold text-gray-900">
                        Manage Branch Notifications
                    </h3>
                </div>
                <button
                    onClick={onAddBranch}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#F14724] text-white rounded-lg hover:bg-[#d63d1e] transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Add Branch
                </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
                Configure notification preferences for each branch individually
            </p>

            <div className="space-y-3">
                {mockBranches.map(branch => (
                    <div key={branch.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div
                            onClick={() => toggleBranch(branch.id)}
                            className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-gray-900">{branch.name}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">{branch.location}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {branch.notificationChannel && (
                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                        {branch.notificationChannel.charAt(0).toUpperCase() + branch.notificationChannel.slice(1)} configured
                                    </span>
                                )}
                                {!branch.notificationChannel && (
                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                                        Not configured
                                    </span>
                                )}
                                {expandedBranch === branch.id ? (
                                    <ChevronUp className="w-5 h-5 text-gray-500" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-500" />
                                )}
                            </div>
                        </div>

                        {expandedBranch === branch.id && (
                            <div className="p-4 bg-white border-t border-gray-200">
                                {branch.notificationChannel ? (
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-medium text-gray-700 mb-2">Notification Channel</p>
                                            <p className="text-sm text-gray-900 capitalize">{branch.notificationChannel}</p>
                                        </div>
                                        {branch.contacts && (
                                            <div>
                                                <p className="text-xs font-medium text-gray-700 mb-2">Contacts</p>
                                                <ul className="space-y-1">
                                                    {branch.contacts.map((contact, idx) => (
                                                        <li key={idx} className="text-sm text-gray-600">• {contact}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        <button className="text-sm text-[#F14724] hover:underline font-medium">
                                            Edit Configuration
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-sm text-gray-600 mb-3">No notification preferences set for this branch</p>
                                        <button className="px-4 py-2 bg-[#F14724] text-white rounded-lg hover:bg-[#d63d1e] transition-colors text-sm font-medium">
                                            Configure Now
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
