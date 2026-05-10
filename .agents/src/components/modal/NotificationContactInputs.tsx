import { NotificationChannel, channelOptions } from './NotificationChannelSelector';

type NotificationContactInputsProps = {
    channel: NotificationChannel;
    contacts: string[];
    errors: string[];
    onContactChange: (index: number, value: string) => void;
};

export const NotificationContactInputs = ({ 
    channel, 
    contacts, 
    errors, 
    onContactChange 
}: NotificationContactInputsProps) => {
    const channelData = channelOptions.find(opt => opt.id === channel);
    
    if (!channelData) return null;

    const Icon = channelData.icon;

    return (
        <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-orange-50 rounded-lg sm:rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-4 sm:mb-5">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${channelData.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900">
                    Enter your contact details
                </h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-5">
                Provide at least 2 {channelData.label.toLowerCase()} contacts for notifications
            </p>
            <div className="space-y-4">
                {contacts.map((contact, index) => (
                    <div key={index}>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                            {channelData.label} Contact {index + 1}
                        </label>
                        <input
                            type="text"
                            value={contact}
                            onChange={(e) => onContactChange(index, e.target.value)}
                            placeholder={channelData.placeholder}
                            className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F14724] transition-all ${
                                errors[index] ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
                            }`}
                        />
                        {errors[index] && (
                            <p className="text-xs sm:text-sm text-red-600 mt-2 flex items-center gap-1">
                                <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
                                {errors[index]}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
