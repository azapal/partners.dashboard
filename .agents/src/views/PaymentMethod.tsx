import React, { useState, useCallback, useRef, ChangeEvent } from "react";
import {
  CreditCard,
  Edit2,
  Check,
  X,
  Lock,
  Eye,
  EyeOff,
  LucideIcon,
} from "lucide-react";

// Type definitions
interface FormData {
  email: string;
  cardNumber: string;
  expiration: string;
  cvc: string;
}

interface FormInputProps {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  disabled: boolean;
  type?: string;
  inputMode?: any;
  maxLength?: number;
  rightElement?: any;
}

interface ButtonProps {
  onClick: () => void;
  variant?: "primary" | "secondary";
  icon?: LucideIcon;
  children: any;
  className?: string;
}

type FormatterFunction = (value: string) => string;

interface Formatters {
  cardNumber: FormatterFunction;
  expiration: FormatterFunction;
  numeric: FormatterFunction;
}

// dummy data
const INITIAL_FORM_DATA: FormData = {
  email: "Ndubisi@gmail.com",
  cardNumber: "4532 1234 5678 9010",
  expiration: "12/25",
  cvc: "123",
};

const formatters: Formatters = {
  // Spaces every 4 digits
  cardNumber: (value: string): string => {
    const cleaned = value.replace(/\s/g, "");
    return cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
  },
  // Auto-formats to MM/YY
  expiration: (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    return cleaned.length >= 2
      ? `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`
      : cleaned;
  },
  // Only digits,no random characters
  numeric: (value: string): string => value.replace(/\D/g, ""),
};

// FormInputs
const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  type = "text",
  inputMode = "text",
  maxLength,
  rightElement,
}) => {
  return (
    <div>
      <label className="block mb-2 sm:mb-3 text-xs sm:text-sm font-semibold text-gray-900">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          inputMode={inputMode}
          maxLength={maxLength}
          className={`w-full rounded-xl min-h-[48px] sm:min-h-[52px] px-3.5 sm:px-4 py-3 text-sm sm:text-base border transition-all duration-200 outline-none
            ${rightElement ? "pr-24 sm:pr-28" : ""}
            ${
              disabled
                ? "bg-amber-50 text-gray-500 border-gray-200"
                : "bg-white text-gray-900 border-gray-200 focus:border-red-700 focus:ring-2 focus:ring-red-700/10"
            }`}
        />
        {/* The rightElements are the cards icons */}
        {rightElement && (
          <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
};

const Button: React.FC<ButtonProps> = ({
  onClick,
  variant = "primary",
  icon: Icon,
  children,
  className = "",
}) => {
  const isPrimary = variant === "primary";

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-full min-h-[48px] sm:min-h-[52px] px-5 sm:px-6 py-3 text-sm sm:text-base font-semibold flex items-center justify-center gap-2 sm:gap-2.5 transition-all duration-200
        ${
          isPrimary
            ? "bg-red-700 text-white hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
            : "bg-red-50 text-red-700 hover:brightness-95 active:scale-[0.98]"
        } ${className}`}
    >
      {Icon && <Icon size={18} className="sm:w-5 sm:h-5" />}
      {children}
    </button>
  );
};

export default function PaymentMethodForm() {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [showCvc, setShowCvc] = useState<boolean>(false);
  const originalDataRef = useRef<FormData>(INITIAL_FORM_DATA);

  const updateField = useCallback(
    (field: keyof FormData, value: string): void => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // This function adds spaces automatically
  const handleCardNumberChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      const cleaned = formatters.numeric(e.target.value);
      if (cleaned.length <= 16) {
        updateField("cardNumber", formatters.cardNumber(cleaned));
      }
    },
    [updateField]
  );

  // MM/YY format on instanltly
  const handleExpirationChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      const cleaned = formatters.numeric(e.target.value);
      if (cleaned.length <= 4) {
        updateField("expiration", formatters.expiration(cleaned));
      }
    },
    [updateField]
  );

  // CVC handler
  const handleCvcChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      const cleaned = formatters.numeric(e.target.value);
      if (cleaned.length <= 3) {
        updateField("cvc", cleaned);
      }
    },
    [updateField]
  );

  // Enable edit mode
  const handleEdit = useCallback((): void => {
    originalDataRef.current = { ...formData }; 
    setIsEditing(true);
  }, [formData]);

  const handleSave = useCallback((): void => {
    setIsEditing(false);
    console.log("Payment details saved:", formData);
  }, [formData]);

  const handleCancel = useCallback((): void => {
    setFormData(originalDataRef.current); 
    setIsEditing(false);
  }, []);

  return (
    <div className="min-h-screen bg-amber-50 p-4 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-lg p-6 sm:p-8">
        {/* Header section */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-700 rounded-full flex items-center justify-center flex-shrink-0">
              <CreditCard className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Payment Method
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Manage your payment details
              </p>
            </div>
          </div>
        </div>

        {/* Form section */}
        <div className="space-y-5 mb-6">
          {/* Email input */}
          <FormInput
            label="Email Address"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="your.email@example.com"
            disabled={!isEditing}
            type="email"
            inputMode="email"
          />

          {/* Card number*/}
          <FormInput
            label="Card Number"
            value={formData.cardNumber}
            onChange={handleCardNumberChange}
            placeholder="1234 5678 9012 3456"
            disabled={!isEditing}
            inputMode="numeric"
            maxLength={19}
            rightElement={
              <div className="flex gap-2">
                <img
                  key="cards"
                  src="/icons/cards.svg"
                  alt="card logos"
                  className="h-4 w-auto sm:h-5 md:h-6 opacity-60"
                  style={{ maxWidth: "164px" }}
                />
              </div>
            }
          />

          {/* Expiration and CVC */}
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Expiration Date"
              value={formData.expiration}
              onChange={handleExpirationChange}
              placeholder="MM/YY"
              disabled={!isEditing}
              inputMode="numeric"
              maxLength={5}
            />

            {/* This is that open and close eye stuff */}
            <FormInput
              label="CVC"
              value={formData.cvc}
              onChange={handleCvcChange}
              placeholder="123"
              disabled={!isEditing}
              type={showCvc ? "text" : "password"}
              inputMode="numeric"
              maxLength={3}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowCvc(!showCvc)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showCvc ? "Hide CVC" : "Show CVC"}
                >
                  {showCvc ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
          </div>
        </div>

        <div className="bg-amber-50 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <Lock size={20} className="text-red-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                Your payment information is secure you can trust Azapal
              </p>
              <p className="text-xs text-gray-600">
                All card details are encrypted and securely stored. We never
                share your information.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {isEditing ? (
            <>
              <Button onClick={handleSave} icon={Check}>
                Save Changes
              </Button>
              <Button onClick={handleCancel} variant="secondary" icon={X}>
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={handleEdit} icon={Edit2}>
              Edit Payment Method
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
