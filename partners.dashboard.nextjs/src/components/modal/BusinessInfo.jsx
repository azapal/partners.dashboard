import React, { useState } from "react";
import {
  Building2,
  MapPin,
  Users,
  Package,
  TrendingUp,
  FileText,
  CreditCard,
  Plus,
  Edit2,
  Phone,
  Mail,
  Globe,
  Clock,
  ChevronRight,
  X,
  Save,
  Upload,
} from "lucide-react";

// Constants
const COLORS = {
  background: "rgba(253, 249, 243, 1)",
  border: "rgba(229, 231, 235, 0.6)",
  borderLight: "rgba(229, 231, 235, 0.8)",
};

const SIZES = {
  touchTarget: "44pt",
  iconContainer: "44pt",
  smallIconContainer: "36pt",
  minText: "11pt",
};

// Reusable Components
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className="bg-white rounded-3xl border p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{ borderColor: COLORS.border }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-gray-900 text-xl sm:text-2xl">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center"
            style={{ width: SIZES.touchTarget, height: SIZES.touchTarget }}
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const SectionCard = ({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  children,
  className = "",
}) => (
  <div
    className={`bg-white rounded-3xl border p-6 sm:p-8 hover:shadow-xl transition-shadow duration-300 ${className}`}
    style={{ borderColor: COLORS.border }}
  >
    <div className="flex items-center gap-3 mb-6">
      <div
        className={`rounded-full ${iconBg} flex items-center justify-center`}
        style={{ width: SIZES.iconContainer, height: SIZES.iconContainer }}
      >
        <Icon className={iconColor} size={22} strokeWidth={2.5} />
      </div>
      <h2 className="font-semibold text-gray-900 text-lg sm:text-xl">
        {title}
      </h2>
    </div>
    {children}
  </div>
);

const FormInput = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  rows,
}) => (
  <div>
    <label className="block text-gray-700 font-medium mb-2 text-sm">
      {label}
    </label>
    {rows ? (
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full p-4 border border-gray-300 rounded-xl focus:border-gray-900 focus:outline-none transition-colors resize-none text-base"
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full p-4 border border-gray-300 rounded-xl focus:border-gray-900 focus:outline-none transition-colors text-base"
        style={{ minHeight: SIZES.touchTarget }}
      />
    )}
  </div>
);

const Button = ({
  onClick,
  variant = "primary",
  icon: Icon,
  children,
  className = "",
}) => {
  const baseStyles =
    "flex items-center justify-center gap-2 rounded-full active:scale-95 transition-all duration-200 font-medium text-sm";
  const variantStyles = {
    primary: "bg-gray-900 text-white hover:bg-gray-800",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={{
        minWidth: SIZES.touchTarget,
        minHeight: SIZES.touchTarget,
        padding: "0 20px",
      }}
    >
      {Icon && <Icon size={16} />}
      <span>{children}</span>
    </button>
  );
};

const ContactInfo = ({ icon: Icon, iconColor, iconBg, text }) => (
  <div className="flex items-center gap-3 text-gray-700">
    <div
      className={`rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}
      style={{
        width: SIZES.smallIconContainer,
        height: SIZES.smallIconContainer,
      }}
    >
      <Icon size={16} className={iconColor} strokeWidth={2.5} />
    </div>
    <span className="text-sm">{text}</span>
  </div>
);

// Main Component
export const BusinessInfo = () => {
  // State Management
  const [modals, setModals] = useState({
    editInfo: false,
    addBranch: false,
    uploadDoc: false,
  });
  const [selectedBranch, setSelectedBranch] = useState(null);

  const [businessInfo, setBusinessInfo] = useState({
    name: "Spoonel Service Men",
    description:
      "Premium delivery and logistics solutions across Nigeria. Fast, reliable, and customer-focused service.",
    email: "contact@spoonel.com",
    phone: "+234 800 123 4567",
    address: "15 Marina Street, Lagos",
    website: "www.spoonel.com",
  });

  const [branches, setBranches] = useState([
    {
      id: 1,
      name: "Central Hub",
      location: "Lagos Island, Lagos",
      manager: "Adebayo Johnson",
      contact: "+234 801 234 5678",
    },
    {
      id: 2,
      name: "Ikeja Branch",
      location: "Ikeja GRA, Lagos",
      manager: "Chioma Okafor",
      contact: "+234 802 345 6789",
    },
    {
      id: 3,
      name: "Victoria Island",
      location: "VI Extension, Lagos",
      manager: "Emeka Nwosu",
      contact: "+234 803 456 7890",
    },
  ]);

  const [newBranch, setNewBranch] = useState({
    name: "",
    location: "",
    manager: "",
    contact: "",
  });

  // Handlers
  const toggleModal = (modalName, value) => {
    setModals((prev) => ({ ...prev, [modalName]: value }));
  };

  const handleSaveInfo = () => {
    toggleModal("editInfo", false);
  };

  const handleAddBranch = () => {
    if (Object.values(newBranch).every((val) => val.trim())) {
      setBranches([...branches, { ...newBranch, id: Date.now() }]);
      setNewBranch({ name: "", location: "", manager: "", contact: "" });
      toggleModal("addBranch", false);
    }
  };

  const operationalMetrics = [
    {
      label: "Total Branches",
      value: "12",
      gradient: "from-blue-50 to-blue-100",
      border: "border-blue-200",
      text: "text-blue-900",
    },
    {
      label: "Total Riders",
      value: "156",
      gradient: "from-purple-50 to-purple-100",
      border: "border-purple-200",
      text: "text-purple-900",
    },
    {
      label: "Active Services",
      value: "8",
      gradient: "from-orange-50 to-orange-100",
      border: "border-orange-200",
      text: "text-orange-900",
    },
    {
      label: "Success Rate",
      value: "98%",
      gradient: "from-green-50 to-green-100",
      border: "border-green-200",
      text: "text-green-900",
    },
  ];

  const contactDetails = [
    {
      icon: Mail,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-50",
      text: businessInfo.email,
    },
    {
      icon: Phone,
      iconColor: "text-green-600",
      iconBg: "bg-green-50",
      text: businessInfo.phone,
    },
    {
      icon: MapPin,
      iconColor: "text-orange-600",
      iconBg: "bg-orange-50",
      text: businessInfo.address,
    },
    {
      icon: Globe,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
      text: businessInfo.website,
    },
  ];

  const performanceStats = [
    { label: "Total Deliveries", value: "2,847", color: "text-gray-900" },
    { label: "Completed", value: "2,791", color: "text-green-600" },
    { label: "Pending", value: "42", color: "text-yellow-600" },
    { label: "Cancelled", value: "14", color: "text-red-600" },
  ];

  const serviceCoverage = [
    { location: "Lagos State", status: "Active", color: "green" },
    { location: "Abuja FCT", status: "Active", color: "green" },
    { location: "Port Harcourt", status: "Active", color: "green" },
    { location: "Ibadan", status: "Limited", color: "yellow" },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: COLORS.background }}
    >
      {/* Header */}
      <header
        className=""
        style={{ borderColor: COLORS.borderLight }}
      >
        <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
                Business Information
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Manage your company details and operational settings
              </p>
            </div>
            <Button onClick={() => toggleModal("editInfo", true)} icon={Edit2}>
              Edit
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">
            {/* Business Overview */}
            <SectionCard
              icon={Building2}
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
              title="Business Overview"
            >
              <div className="flex flex-col sm:flex-row gap-6">
                <div
                  className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center border border-gray-200 flex-shrink-0"
                  style={{ width: "88pt", height: "88pt" }}
                >
                  <Building2
                    size={40}
                    className="text-gray-400"
                    strokeWidth={1.5}
                  />
                </div>

                <div className="flex-1 space-y-5">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-xl sm:text-2xl tracking-tight">
                      {businessInfo.name}
                    </h3>
                    <p className="text-gray-600 mt-2 leading-relaxed text-sm sm:text-base">
                      {businessInfo.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {contactDetails.map((contact, idx) => (
                      <ContactInfo key={idx} {...contact} />
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Operational Summary */}
            <SectionCard
              icon={TrendingUp}
              iconColor="text-indigo-600"
              iconBg="bg-indigo-50"
              title="Operational Summary"
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {operationalMetrics.map((metric, idx) => (
                  <div
                    key={idx}
                    className={`bg-gradient-to-br ${metric.gradient} rounded-2xl p-5 sm:p-6 border ${metric.border} hover:scale-105 transition-transform duration-200`}
                  >
                    <p
                      className={`${metric.text.replace(
                        "900",
                        "700"
                      )} font-medium mb-2 text-xs sm:text-sm`}
                    >
                      {metric.label}
                    </p>
                    <p
                      className={`font-semibold ${metric.text} text-3xl sm:text-4xl`}
                    >
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Branch Details */}
            <SectionCard
              icon={MapPin}
              iconColor="text-orange-600"
              iconBg="bg-orange-50"
              title="Branch Details"
            >
              <div className="flex justify-end mb-6">
                <Button
                  onClick={() => toggleModal("addBranch", true)}
                  icon={Plus}
                >
                  Add Branch
                </Button>
              </div>

              <div className="space-y-3">
                {branches.map((branch) => (
                  <button
                    key={branch.id}
                    onClick={() => setSelectedBranch(branch)}
                    className="w-full bg-gradient-to-r from-gray-50 to-white rounded-2xl p-5 border border-gray-200 hover:border-gray-900 hover:shadow-lg transition-all duration-200 text-left"
                    style={{ minHeight: SIZES.touchTarget }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-3 text-base">
                          {branch.name}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin
                              size={14}
                              className="text-orange-500 flex-shrink-0"
                              strokeWidth={2.5}
                            />
                            <span className="truncate">{branch.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users
                              size={14}
                              className="text-blue-500 flex-shrink-0"
                              strokeWidth={2.5}
                            />
                            <span className="truncate">{branch.manager}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 sm:col-span-2">
                            <Phone
                              size={14}
                              className="text-green-500 flex-shrink-0"
                              strokeWidth={2.5}
                            />
                            <span>{branch.contact}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight
                        size={22}
                        className="text-gray-400 flex-shrink-0"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </SectionCard>

            {/* Documents */}
            <SectionCard
              icon={FileText}
              iconColor="text-yellow-600"
              iconBg="bg-yellow-50"
              title="Documents & Compliance"
            >
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 bg-gradient-to-r from-green-50 to-white rounded-xl border border-green-200">
                  <div>
                    <p className="font-semibold text-gray-900 text-base">
                      Company Registration
                    </p>
                    <p className="text-gray-600 mt-1 text-sm">RC-123456789</p>
                  </div>
                  <span className="font-medium bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs self-start">
                    Verified
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 bg-gradient-to-r from-green-50 to-white rounded-xl border border-green-200">
                  <div>
                    <p className="font-semibold text-gray-900 text-base">
                      Business License
                    </p>
                    <p className="text-gray-600 mt-1 text-sm">
                      Valid until Dec 2025
                    </p>
                  </div>
                  <span className="font-medium bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs self-start">
                    Active
                  </span>
                </div>

                <button
                  onClick={() => toggleModal("uploadDoc", true)}
                  className="w-full p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-gray-900 hover:bg-gray-50 transition-all duration-200 text-gray-600 hover:text-gray-900 font-medium flex items-center justify-center gap-2 text-sm"
                  style={{ minHeight: SIZES.touchTarget }}
                >
                  <Plus size={18} />
                  <span>Upload New Document</span>
                </button>
              </div>
            </SectionCard>

            {/* Account & Billing */}
            <SectionCard
              icon={CreditCard}
              iconColor="text-pink-600"
              iconBg="bg-pink-50"
              title="Account & Billing"
            >
              <div className="space-y-5">
                {[
                  {
                    label: "Default Bank Account",
                    value: "First Bank of Nigeria - 0123456789",
                  },
                  {
                    label: "Billing Address",
                    value: "15 Marina Street, Lagos Island, Lagos State",
                  },
                  { label: "Tax ID", value: "TIN-12345678-0001" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={idx < 2 ? "pb-5 border-b border-gray-200" : ""}
                  >
                    <p className="text-gray-500 mb-2 font-medium text-xs sm:text-sm">
                      {item.label}
                    </p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* Right Sidebar */}
          <aside className="lg:col-span-4 space-y-4 sm:space-y-6">
            {/* Delivery Time */}
            <SectionCard
              icon={Clock}
              iconColor="text-cyan-600"
              iconBg="bg-cyan-50"
              title="Delivery Time"
              className="lg:sticky lg:top-24"
            >
              <div className="space-y-5">
                {[
                  {
                    label: "This Week",
                    value: "24 mins",
                    width: "80%",
                    color: "from-green-500 to-green-400",
                  },
                  {
                    label: "Last Week",
                    value: "28 mins",
                    width: "70%",
                    color: "from-blue-500 to-blue-400",
                  },
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-gray-600 font-medium">
                        {item.label}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {item.value}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`bg-gradient-to-r ${item.color} h-2.5 rounded-full transition-all duration-500`}
                        style={{ width: item.width }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Monthly Performance */}
            <SectionCard
              icon={TrendingUp}
              iconColor="text-gray-900"
              iconBg="bg-gray-50"
              title="Monthly Performance"
            >
              <div className="space-y-4">
                {performanceStats.map((stat, idx) => (
                  <div
                    key={idx}
                    className={`flex justify-between items-center ${
                      idx < 3 ? "pb-3 border-b border-gray-100" : ""
                    }`}
                  >
                    <span className="text-gray-600 text-sm font-medium">
                      {stat.label}
                    </span>
                    <span className={`font-semibold ${stat.color} text-base`}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Service Coverage */}
            <SectionCard
              icon={Package}
              iconColor="text-teal-600"
              iconBg="bg-teal-50"
              title="Service Coverage"
            >
              <div className="space-y-3">
                {serviceCoverage.map((service, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-gray-700 text-sm font-medium">
                      {service.location}
                    </span>
                    <span
                      className={`text-xs font-semibold bg-${service.color}-100 text-${service.color}-700 px-3 py-1 rounded-full`}
                    >
                      {service.status}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </aside>
        </div>
      </main>

      {/* Modals */}
      <Modal
        isOpen={modals.editInfo}
        onClose={() => toggleModal("editInfo", false)}
        title="Edit Business Information"
      >
        <div className="space-y-4">
          <FormInput
            label="Business Name"
            value={businessInfo.name}
            onChange={(e) =>
              setBusinessInfo({ ...businessInfo, name: e.target.value })
            }
          />
          <FormInput
            label="Description"
            value={businessInfo.description}
            onChange={(e) =>
              setBusinessInfo({ ...businessInfo, description: e.target.value })
            }
            rows={3}
          />
          <FormInput
            label="Email"
            type="email"
            value={businessInfo.email}
            onChange={(e) =>
              setBusinessInfo({ ...businessInfo, email: e.target.value })
            }
          />
          <FormInput
            label="Phone"
            type="tel"
            value={businessInfo.phone}
            onChange={(e) =>
              setBusinessInfo({ ...businessInfo, phone: e.target.value })
            }
          />
          <FormInput
            label="Address"
            value={businessInfo.address}
            onChange={(e) =>
              setBusinessInfo({ ...businessInfo, address: e.target.value })
            }
          />
          <FormInput
            label="Website"
            value={businessInfo.website}
            onChange={(e) =>
              setBusinessInfo({ ...businessInfo, website: e.target.value })
            }
          />
        </div>
        <div className="flex gap-3 mt-6">
          <Button
            onClick={() => toggleModal("editInfo", false)}
            variant="secondary"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button onClick={handleSaveInfo} icon={Save} className="flex-1">
            Save Changes
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={modals.addBranch}
        onClose={() => toggleModal("addBranch", false)}
        title="Add New Branch"
      >
        <div className="space-y-4">
          <FormInput
            label="Branch Name"
            placeholder="e.g., Lekki Branch"
            value={newBranch.name}
            onChange={(e) =>
              setNewBranch({ ...newBranch, name: e.target.value })
            }
          />
          <FormInput
            label="Location"
            placeholder="e.g., Lekki Phase 1, Lagos"
            value={newBranch.location}
            onChange={(e) =>
              setNewBranch({ ...newBranch, location: e.target.value })
            }
          />
          <FormInput
            label="Manager Name"
            placeholder="e.g., John Doe"
            value={newBranch.manager}
            onChange={(e) =>
              setNewBranch({ ...newBranch, manager: e.target.value })
            }
          />
          <FormInput
            label="Contact Number"
            type="tel"
            placeholder="+234 800 000 0000"
            value={newBranch.contact}
            onChange={(e) =>
              setNewBranch({ ...newBranch, contact: e.target.value })
            }
          />
        </div>
        <div className="flex gap-3 mt-6">
          <Button
            onClick={() => toggleModal("addBranch", false)}
            variant="secondary"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button onClick={handleAddBranch} icon={Plus} className="flex-1">
            Add Branch
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={modals.uploadDoc}
        onClose={() => toggleModal("uploadDoc", false)}
        title="Upload Document"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2 text-sm">
              Document Type
            </label>
            <select
              className="w-full p-4 border border-gray-300 rounded-xl focus:border-gray-900 focus:outline-none transition-colors text-base"
              style={{ minHeight: SIZES.touchTarget }}
            >
              <option>Business License</option>
              <option>Tax Certificate</option>
              <option>Insurance Document</option>
              <option>Permit</option>
              <option>Other</option>
            </select>
          </div>
          <FormInput
            label="Document Name"
            placeholder="e.g., Business License 2025"
          />
          <div>
            <label className="block text-gray-700 font-medium mb-2 text-sm">
              Upload File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-900 hover:bg-gray-50 transition-all cursor-pointer">
              <Upload size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium text-base">
                Click to upload or drag and drop
              </p>
              <p className="text-gray-500 mt-2 text-sm">
                PDF, JPG, PNG (max. 10MB)
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button
            onClick={() => toggleModal("uploadDoc", false)}
            variant="secondary"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => toggleModal("uploadDoc", false)}
            icon={Upload}
            className="flex-1"
          >
            Upload Document
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={!!selectedBranch}
        onClose={() => setSelectedBranch(null)}
        title={selectedBranch?.name || ""}
      >
        {selectedBranch && (
          <>
            <div className="space-y-5">
              {[
                {
                  icon: MapPin,
                  iconColor: "text-orange-600",
                  iconBg: "bg-orange-50",
                  label: "Location",
                  value: selectedBranch.location,
                },
                {
                  icon: Users,
                  iconColor: "text-blue-600",
                  iconBg: "bg-blue-50",
                  label: "Branch Manager",
                  value: selectedBranch.manager,
                },
                {
                  icon: Phone,
                  iconColor: "text-green-600",
                  iconBg: "bg-green-50",
                  label: "Contact Number",
                  value: selectedBranch.contact,
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <div
                    className={`rounded-full ${item.iconBg} flex items-center justify-center flex-shrink-0`}
                    style={{
                      width: SIZES.iconContainer,
                      height: SIZES.iconContainer,
                    }}
                  >
                    <item.icon
                      size={20}
                      className={item.iconColor}
                      strokeWidth={2.5}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-500 font-medium mb-1 text-xs sm:text-sm">
                      {item.label}
                    </p>
                    <p className="text-gray-900 font-semibold text-sm sm:text-base">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setSelectedBranch(null)}
                variant="secondary"
                className="flex-1"
              >
                Close
              </Button>
              <Button icon={Edit2} className="flex-1">
                Edit Branch
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
