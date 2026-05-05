import { useState } from 'react';
import { Check, Bell, ChevronRight, ChevronLeft } from 'lucide-react';
import { NotificationChannelSelector, NotificationChannel } from './NotificationChannelSelector';
import { NotificationContactInputs } from './NotificationContactInputs';
import { BranchSelector } from './BranchSelector';
import { SubBranchSelector } from './SubBranchSelector';

type NotificationPreferenceProps = {
    currentBranch?: {
        id: string;
        name: string;
        type: 'headquarters' | 'branch' | 'sub-branch';
    };
};

export const NotificationPreference = ({ currentBranch }: NotificationPreferenceProps) => {
    const [currentStep, setCurrentStep] = useState(1);
    
    // Step 1: Branch and Managers
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [selectedManagers, setSelectedManagers] = useState<string[]>([]);
    
    // Step 2: Sub-branch and Members
    const [selectedSubBranchId, setSelectedSubBranchId] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    
    // Step 3: Notification Channel and Contacts
    const [selectedChannel, setSelectedChannel] = useState<NotificationChannel | ''>('');
    const [contacts, setContacts] = useState<string[]>(['', '']);
    const [errors, setErrors] = useState<string[]>([]);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Default to headquarters if not provided
    const branch = currentBranch || { id: 'hq', name: 'Headquarters', type: 'headquarters' as const };

    const handleChannelChange = (channel: NotificationChannel) => {
        setSelectedChannel(channel);
        setContacts(['', '']);
        setErrors([]);
        setIsSubmitted(false);
    };

    const handleContactChange = (index: number, value: string) => {
        const newContacts = [...contacts];
        newContacts[index] = value;
        setContacts(newContacts);

        const newErrors = [...errors];
        newErrors[index] = '';
        setErrors(newErrors);
    };

    const validateContacts = (): boolean => {
        const newErrors: string[] = [];
        let isValid = true;

        contacts.forEach((contact, index) => {
            if (!contact.trim()) {
                newErrors[index] = 'This field is required';
                isValid = false;
            } else if (selectedChannel === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(contact)) {
                    newErrors[index] = 'Please enter a valid email address';
                    isValid = false;
                }
            } else {
                const phoneRegex = /^\+?[\d\s-]{10,}$/;
                if (!phoneRegex.test(contact)) {
                    newErrors[index] = 'Please enter a valid phone number';
                    isValid = false;
                }
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    const handleNextStep = () => {
        if (currentStep === 1 && !selectedBranchId) {
            alert('Please select a branch');
            return;
        }
        if (currentStep === 2 && !selectedSubBranchId) {
            alert('Please select a sub-branch');
            return;
        }
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePreviousStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedChannel) {
            alert('Please select a notification channel');
            return;
        }

        if (validateContacts()) {
            // Save the complete notification preferences
            const preferences = {
                branchId: selectedBranchId,
                branchManagers: selectedManagers,
                subBranchId: selectedSubBranchId,
                subBranchMembers: selectedMembers,
                notificationChannel: selectedChannel,
                contacts: contacts,
            };
            
            console.log('Saving notification preferences:', preferences);
            setIsSubmitted(true);
            setTimeout(() => {
                setIsSubmitted(false);
                // Reset form or close modal
            }, 3000);
        }
    };

    const steps = [
        { number: 1, title: 'Select Branch', description: 'Choose branch and managers' },
        { number: 2, title: 'Select Sub-Branch', description: 'Choose sub-branch and team' },
        { number: 3, title: 'Notification Channel', description: 'Configure preferences' },
    ];

    return (
        <div className="w-full py-4 sm:py-8 px-3 sm:px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-left mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-[#F14724]" />
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                            Notification Preferences
                        </h1>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">
                        Configure notification settings for {branch.name}
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div key={step.number} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-semibold transition-all ${
                                        currentStep === step.number
                                            ? 'bg-[#F14724] text-white'
                                            : currentStep > step.number
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-200 text-gray-500'
                                    }`}>
                                        {currentStep > step.number ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : step.number}
                                    </div>
                                    <div className="mt-1 sm:mt-2 text-center">
                                        <p className={`text-[10px] sm:text-xs font-medium ${
                                            currentStep === step.number ? 'text-[#F14724]' : 'text-gray-500'
                                        }`}>
                                            {step.title}
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">{step.description}</p>
                                    </div>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`h-0.5 flex-1 mx-1 sm:mx-2 ${
                                        currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step Content */}
                <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6 min-h-[300px] sm:min-h-[400px]">
                    {/* Step 1: Branch Selection */}
                    {currentStep === 1 && (
                        <BranchSelector
                            selectedBranchId={selectedBranchId}
                            onBranchSelect={setSelectedBranchId}
                            selectedManagers={selectedManagers}
                            onManagersChange={setSelectedManagers}
                        />
                    )}

                    {/* Step 2: Sub-Branch Selection */}
                    {currentStep === 2 && (
                        <SubBranchSelector
                            branchId={selectedBranchId}
                            selectedSubBranchId={selectedSubBranchId}
                            onSubBranchSelect={setSelectedSubBranchId}
                            selectedMembers={selectedMembers}
                            onMembersChange={setSelectedMembers}
                        />
                    )}

                    {/* Step 3: Notification Channel */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                                    Choose Notification Channel
                                </h2>
                                <p className="text-sm text-gray-600 mb-4">
                                    This channel will be used for all notifications to the selected sub-branch
                                </p>
                                <NotificationChannelSelector
                                    selectedChannel={selectedChannel}
                                    onChannelChange={handleChannelChange}
                                />
                            </div>

                            {selectedChannel && (
                                <NotificationContactInputs
                                    channel={selectedChannel}
                                    contacts={contacts}
                                    errors={errors}
                                    onContactChange={handleContactChange}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between gap-2 sm:gap-4">
                    <button
                        onClick={handlePreviousStep}
                        disabled={currentStep === 1}
                        className={`flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold transition-all ${
                            currentStep === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                    >
                        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">Previous</span>
                        <span className="sm:hidden">Back</span>
                    </button>

                    {currentStep < 3 ? (
                        <button
                            onClick={handleNextStep}
                            className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#F14724] text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:bg-[#d63d1e] transition-all"
                        >
                            Next
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedChannel}
                            className={`flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold transition-all ${
                                selectedChannel
                                    ? 'bg-[#F14724] text-white hover:bg-[#d63d1e]'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            {isSubmitted ? (
                                <>
                                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                                    Saved!
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="hidden sm:inline">Save Preferences</span>
                                    <span className="sm:hidden">Save</span>
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6 px-2">
                    You can update notification preferences anytime from settings
                </p>
            </div>
        </div>
    );
};