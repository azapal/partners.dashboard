import {DashboardLayout} from "../layouts/DashboardLayout";
import { Package, Truck, Clock, DollarSign, MapPin, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import {useState} from "react";


export const ServiceScreen = () => {
    const [formData, setFormData] = useState({
        serviceTypes: [],
        deliveryRegions: [],
        operatingHours: '',
        transitTimes: {
            local: '',
            regional: '',
            national: '',
            international: ''
        },
        trackingAvailable: '',
        insurance: '',
        packagingServices: '',
        weightLimits: {
            min: '',
            max: ''
        },
        dimensionLimits: '',
        pricingStructure: '',
        paymentMethods: [],
        specialServices: [],
        prohibitedItems: '',
        deliveryProof: '',
        customerSupport: '',
        additionalInfo: ''
    });

    const [openSection, setOpenSection] = useState(0);

    const serviceTypeOptions = [
        'Standard Delivery',
        'Express Delivery',
        'Same-Day Delivery',
        'International Shipping',
        'Freight Services',
        'Last-Mile Delivery',
        'Warehousing',
        'Cold Chain Logistics'
    ];

    const paymentMethodOptions = [
        'Cash on Delivery',
        'Credit/Debit Card',
        'Bank Transfer',
        'Mobile Money',
        'Online Payment Gateway',
        'Corporate Account'
    ];

    const specialServiceOptions = [
        'Fragile Item Handling',
        'Temperature Controlled',
        'Hazardous Materials',
        'White Glove Service',
        'Assembly/Installation',
        'Scheduled Delivery',
        'Return Services',
        'Bulk Shipping Discounts'
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleTransitTimeChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            transitTimes: {
                ...prev.transitTimes,
                [name]: value
            }
        }));
    };

    const handleWeightLimitChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            weightLimits: {
                ...prev.weightLimits,
                [name]: value
            }
        }));
    };

    const handleCheckboxChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(item => item !== value)
                : [...prev[field], value]
        }));
    };

    const toggleSection = (index) => {
        setOpenSection(openSection === index ? -1 : index);
    };

    const handleNext = () => {
        if (openSection < sections.length - 1) {
            setOpenSection(openSection + 1);
        }
    };

    const handleSubmit = () => {
        console.log('Service Information:', formData);
        alert('Service information collected successfully! Check console for details.');
    };

    const sections = [
        {
            title: 'Service Types Offered',
            icon: <Package className="w-5 h-5" />,
            content: (
                <div className="grid md:grid-cols-2 gap-3">
                    {serviceTypeOptions.map(service => (
                        <label key={service} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                                type="checkbox"
                                checked={formData.serviceTypes.includes(service)}
                                onChange={() => handleCheckboxChange('serviceTypes', service)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-gray-700">{service}</span>
                        </label>
                    ))}
                </div>
            )
        },
        {
            title: 'Coverage & Operations',
            icon: <MapPin className="w-5 h-5" />,
            content: (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Delivery Regions (comma-separated)
                        </label>
                        <input
                            type="text"
                            name="deliveryRegions"
                            value={formData.deliveryRegions}
                            onChange={handleChange}
                            placeholder="e.g., Lagos, Abuja, Port Harcourt"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Operating Hours
                        </label>
                        <input
                            type="text"
                            name="operatingHours"
                            value={formData.operatingHours}
                            onChange={handleChange}
                            placeholder="e.g., Monday-Friday: 8AM-6PM, Saturday: 9AM-2PM"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            )
        },
        {
            title: 'Expected Transit Times',
            icon: <Clock className="w-5 h-5" />,
            content: (
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Local Delivery</label>
                        <input
                            type="text"
                            name="local"
                            value={formData.transitTimes.local}
                            onChange={handleTransitTimeChange}
                            placeholder="e.g., 1-2 business days"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Regional</label>
                        <input
                            type="text"
                            name="regional"
                            value={formData.transitTimes.regional}
                            onChange={handleTransitTimeChange}
                            placeholder="e.g., 2-4 business days"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">National</label>
                        <input
                            type="text"
                            name="national"
                            value={formData.transitTimes.national}
                            onChange={handleTransitTimeChange}
                            placeholder="e.g., 3-7 business days"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">International</label>
                        <input
                            type="text"
                            name="international"
                            value={formData.transitTimes.international}
                            onChange={handleTransitTimeChange}
                            placeholder="e.g., 7-14 business days"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            )
        },
        {
            title: 'Package Specifications',
            icon: <Package className="w-5 h-5" />,
            content: (
                <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Minimum Weight (kg)
                            </label>
                            <input
                                type="text"
                                name="min"
                                value={formData.weightLimits.min}
                                onChange={handleWeightLimitChange}
                                placeholder="e.g., 0.5"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Maximum Weight (kg)
                            </label>
                            <input
                                type="text"
                                name="max"
                                value={formData.weightLimits.max}
                                onChange={handleWeightLimitChange}
                                placeholder="e.g., 50"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Maximum Dimensions (L x W x H)
                        </label>
                        <input
                            type="text"
                            name="dimensionLimits"
                            value={formData.dimensionLimits}
                            onChange={handleChange}
                            placeholder="e.g., 120cm x 80cm x 80cm"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            )
        },
        {
            title: 'Services & Features',
            icon: <Truck className="w-5 h-5" />,
            content: (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Real-Time Tracking Available?
                        </label>
                        <select
                            name="trackingAvailable"
                            value={formData.trackingAvailable}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Select...</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                            <option value="premium-only">Premium Service Only</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Insurance Coverage
                        </label>
                        <input
                            type="text"
                            name="insurance"
                            value={formData.insurance}
                            onChange={handleChange}
                            placeholder="e.g., Up to ₦500,000 or Based on declared value"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Packaging Services
                        </label>
                        <input
                            type="text"
                            name="packagingServices"
                            value={formData.packagingServices}
                            onChange={handleChange}
                            placeholder="e.g., Free packaging materials, Custom crating available"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Special Services
                        </label>
                        <div className="grid md:grid-cols-2 gap-3">
                            {specialServiceOptions.map(service => (
                                <label key={service} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                    <input
                                        type="checkbox"
                                        checked={formData.specialServices.includes(service)}
                                        onChange={() => handleCheckboxChange('specialServices', service)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">{service}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: 'Pricing & Payment',
            icon: <DollarSign className="w-5 h-5" />,
            content: (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pricing Structure
                        </label>
                        <textarea
                            name="pricingStructure"
                            value={formData.pricingStructure}
                            onChange={handleChange}
                            placeholder="Describe your pricing model (e.g., weight-based, distance-based, flat rates)"
                            rows="3"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Methods Accepted
                        </label>
                        <div className="grid md:grid-cols-2 gap-3">
                            {paymentMethodOptions.map(method => (
                                <label key={method} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                    <input
                                        type="checkbox"
                                        checked={formData.paymentMethods.includes(method)}
                                        onChange={() => handleCheckboxChange('paymentMethods', method)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">{method}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: 'Policies & Support',
            icon: <FileText className="w-5 h-5" />,
            content: (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prohibited Items
                        </label>
                        <textarea
                            name="prohibitedItems"
                            value={formData.prohibitedItems}
                            onChange={handleChange}
                            placeholder="List items you cannot ship (e.g., hazardous materials, illegal items, perishables)"
                            rows="3"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Proof of Delivery
                        </label>
                        <input
                            type="text"
                            name="deliveryProof"
                            value={formData.deliveryProof}
                            onChange={handleChange}
                            placeholder="e.g., Signature required, Photo proof, Digital confirmation"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Customer Support
                        </label>
                        <input
                            type="text"
                            name="customerSupport"
                            value={formData.customerSupport}
                            onChange={handleChange}
                            placeholder="e.g., 24/7 hotline, Email support, Live chat"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            )
        },
        {
            title: 'Additional Information',
            icon: <FileText className="w-5 h-5" />,
            content: (
                <div>
          <textarea
              name="additionalInfo"
              value={formData.additionalInfo}
              onChange={handleChange}
              placeholder="Any other important information customers should know..."
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
                </div>
            )
        }
    ];

    return (
        <DashboardLayout>
            <div className="min-h-screen">
            <div className="w-full">
                {/*bg-white rounded-lg shadow-xl*/}
                <div className="">
                    <div className="flex items-center gap-3 mb-8">
                        {/*<Truck className="w-10 h-10 text-blue-600" />*/}
                        <div>
                            {/*<h1 className="text-3xl font-bold text-gray-800">Logistics Service Information</h1>*/}
                            <p className="text-gray-600">Complete service details for customer reference</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {/*border border-gray-200*/}
                        {sections.map((section, index) => (
                            <div key={index} className="shadow rounded-lg overflow-hidden">
                                <button
                                    onClick={() => toggleSection(index)}
                                    className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-black">{section.icon}</div>
                                        <span className="font-semibold text-gray-800">{section.title}</span>
                                    </div>
                                    {openSection === index ? (
                                        <ChevronUp className="w-5 h-5 text-gray-600" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-600" />
                                    )}
                                </button>

                                {openSection === index && (
                                    <div className="p-6 bg-white">
                                        {section.content}
                                        <div className="flex justify-end gap-3 mt-6">
                                            {index < sections.length - 1 && (
                                                <button
                                                    onClick={handleNext}
                                                    className="bg-black text-white px-6 py-2 rounded-2xl cursor-pointer font-semibold transition-colors"
                                                >
                                                    Next Section
                                                </button>
                                            )}
                                            {index === sections.length - 1 && (
                                                <button
                                                    onClick={handleSubmit}
                                                    className="bg-black text-white px-8 py-2 rounded-2xl font-semibold transition-colors flex items-center gap-2"
                                                >
                                                    <Package className="w-5 h-5" />
                                                    Submit Information
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
                        <span>Section {openSection + 1} of {sections.length}</span>
                        <span className="text-black font-medium">
              {Math.round(((openSection + 1) / sections.length) * 100)}% Complete
            </span>
                    </div>
                </div>
            </div>
        </div>
        </DashboardLayout>
    );
}