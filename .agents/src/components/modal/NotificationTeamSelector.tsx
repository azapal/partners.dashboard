import { useState } from 'react';
import { Users, X } from 'lucide-react';

type TeamMember = {
    id: string;
    name: string;
    email: string;
    role: string;
};

type NotificationTeamSelectorProps = {
    notificationType: 'orders' | 'payments';
    selectedMembers: string[];
    onMembersChange: (memberIds: string[]) => void;
};

// Mock team members - replace with actual data
const mockTeamMembers: TeamMember[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Manager' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Sales' },
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'Operations' },
    { id: '4', name: 'Sarah Williams', email: 'sarah@example.com', role: 'Support' },
];

export const NotificationTeamSelector = ({ 
    notificationType, 
    selectedMembers, 
    onMembersChange 
}: NotificationTeamSelectorProps) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredMembers = mockTeamMembers.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleMember = (memberId: string) => {
        if (selectedMembers.includes(memberId)) {
            onMembersChange(selectedMembers.filter(id => id !== memberId));
        } else {
            onMembersChange([...selectedMembers, memberId]);
        }
    };

    const selectedMemberObjects = mockTeamMembers.filter(m => selectedMembers.includes(m.id));

    return (
        <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-gray-600" />
                <h4 className="text-sm font-semibold text-gray-900">
                    Loop team members in {notificationType} notifications
                </h4>
            </div>

            {/* Search input */}
            <div className="mb-4">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search team members..."
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F14724] focus:border-transparent"
                />
            </div>

            {/* Selected members */}
            {selectedMemberObjects.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                    {selectedMemberObjects.map(member => (
                        <div
                            key={member.id}
                            className="inline-flex items-center gap-2 bg-[#F14724] text-white px-3 py-1 rounded-full text-sm"
                        >
                            <span>{member.name}</span>
                            <button
                                onClick={() => toggleMember(member.id)}
                                className="hover:bg-white/20 rounded-full p-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Team member list */}
            <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                {filteredMembers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                        No team members found
                    </div>
                ) : (
                    filteredMembers.map(member => (
                        <label
                            key={member.id}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        >
                            <input
                                type="checkbox"
                                checked={selectedMembers.includes(member.id)}
                                onChange={() => toggleMember(member.id)}
                                className="w-4 h-4 text-[#F14724] border-gray-300 rounded focus:ring-[#F14724]"
                            />
                            <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                <div className="text-xs text-gray-500">{member.email} · {member.role}</div>
                            </div>
                        </label>
                    ))
                )}
            </div>
        </div>
    );
};
