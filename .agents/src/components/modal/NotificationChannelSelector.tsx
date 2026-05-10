import { Mail, MessageSquare, Phone, Check } from 'lucide-react';

type NotificationChannel = 'whatsapp' | 'sms' | 'email';

type NotificationChannelSelectorProps = {
    selectedChannel: NotificationChannel | '';
    onChannelChange: (channel: NotificationChannel) => void;
};

const channelOptions = [
    {
        id: 'whatsapp' as NotificationChannel,
        label: 'WhatsApp',
        icon: MessageSquare,
        placeholder: 'e.g., +234 123 456 7890',
        description: 'Get instant notifications on WhatsApp',
        color: 'from-green-500 to-emerald-600'
    },
    {
        id: 'sms' as NotificationChannel,
        label: 'SMS',
        icon: Phone,
        placeholder: 'e.g., +234 123 456 7890',
        description: 'Receive notifications via text message',
        color: 'from-blue-500 to-indigo-600'
    },
    {
        id: 'email' as NotificationChannel,
        label: 'Email',
        icon: Mail,
        placeholder: 'e.g., example@email.com',
        description: 'Stay updated through email notifications',
        color: 'from-purple-500 to-pink-600'
    }
];

export const NotificationChannelSelector = ({ selectedChannel, onChannelChange }: NotificationChannelSelectorProps) => {
    return (
        <div className="space-y-3">
            {channelOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedChannel === option.id;
                return (
                    <div
                        key={option.id}
                        onClick={() => onChannelChange(option.id)}
                        className={`relative flex items-start p-3 sm:p-4 border-2 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 ${
                            isSelected
                                ? 'border-[#F14724] bg-orange-50 shadow-md'
                                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'
                        }`}
                    >
                        <div className="flex items-center h-6 mt-1">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected
                                    ? 'border-[#F14724] bg-[#F14724]'
                                    : 'border-gray-300 bg-white'
                            }`}>
                                {isSelected && (
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                            </div>
                        </div>

                        <div className="ml-3 sm:ml-4 flex-1">
                            <div className="flex items-center gap-2 sm:gap-3 mb-1">
                                <div>
                                    <span className="text-xs sm:text-sm font-semibold text-gray-900 block">
                                        {option.label}
                                    </span>
                                    <span className="text-[10px] sm:text-xs text-gray-500">
                                        {option.description}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {isSelected && (
                            <div className="absolute top-4 right-4">
                                <div className="w-6 h-6 bg-[#F14724] rounded-full flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export { channelOptions };
export type { NotificationChannel };
