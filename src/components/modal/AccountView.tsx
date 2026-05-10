import {Mail, User, Briefcase, Building2} from "lucide-react";
import React, { useState } from "react";
import { Link } from "react-router-dom";

interface DetailCardProps {
  icon: any;
  label: string;
  value: string;
}

export const AccountView = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [businessInfo, setBusinessInfo] = useState({
    name: "Spoonel Service Men",
    description:
        "Premium delivery and logistics solutions across Nigeria. Fast, reliable, and customer-focused service.",
    email: "contact@spoonel.com",
    phone: "+234 800 123 4567",
    address: "15 Marina Street, Lagos",
    website: "www.spoonel.com",
  });

  const handleEdit = () => {
    setIsEditing(true);

    alert("Edit mode activated!");
    setTimeout(() => setIsEditing(false), 1000);
  };

  return (
    <div className="min-h-screen" style={{ background: "rgba(253, 249, 243, 1)" }}>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="border-gray-200 overflow-hidden">
          <div className="pt-8 sm:pt-12 pb-6 sm:pb-8 text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto shadow-xl">
                <img
                  src="/spoonel_service_men_logo.jpeg"
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div className="absolute bottom-1 right-1 w-7 h-7 bg-green-500 rounded-full border-4 border-white shadow-sm"></div>
            </div>

            {/*<h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-semibold text-gray-900">*/}
            {/*  Ukonu Ndubuisi Chibuike*/}
            {/*</h2>*/}
            {/*<p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-400">*/}
            {/*  Ndubuisi chibuike*/}
            {/*</p>*/}
          </div>
          <div className="flex flex-col sm:flex-row gap-6">
            {/*<div*/}
            {/*    className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center border border-gray-200 flex-shrink-0"*/}
            {/*    style={{ width: "88pt", height: "88pt" }}*/}
            {/*>*/}
            {/*  <Building2*/}
            {/*      size={40}*/}
            {/*      className="text-gray-400"*/}
            {/*      strokeWidth={1.5}*/}
            {/*  />*/}
            {/*</div>*/}

            <div className="flex-1 space-y-5">
              <div>
                <h3 className="font-semibold text-gray-900 text-xl sm:text-2xl tracking-tight">
                  {businessInfo.name}
                </h3>
                <p className="text-gray-600 mt-2 leading-relaxed text-sm sm:text-base">
                  {businessInfo.description}
                </p>
              </div>

            </div>
          </div>

          <div className="pb-6 sm:pb-8 mt-6">
            <h3 className="px-2 mb-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Account Details
            </h3>

            <div className="space-y-2">
              <DetailCard
                icon={<User className="w-5 h-5" />}
                label="Username"
                value="@Ukonu Ndubuisi Chibuike"
              />

              <DetailCard
                icon={<Mail className="w-5 h-5" />}
                label="Email"
                value="ndubuisi@example.com"
              />

              <DetailCard
                icon={<Briefcase className="w-5 h-5" />}
                label="Role"
                value="Admin"
              />
            </div>
          </div>

          {/* Edit Button */}
          {/*<div className="pb-6">*/}
          {/*  <button*/}
          {/*    onClick={handleEdit}*/}
          {/*    className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3.5 sm:py-4 px-6 rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"*/}
          {/*    disabled={isEditing}*/}
          {/*  >*/}
          {/*    {isEditing ? "Opening Editor..." : "Edit Profile"}*/}
          {/*  </button>*/}
          {/*</div>*/}
        </div>
      </div>
    </div>
  );
}

function DetailCard({ icon, label, value }: DetailCardProps) {
  return (
    <div className="bg-white hover:bg-gray-100 rounded-2xl p-3 sm:p-4 transition-colors duration-200">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-xl flex items-center justify-center text-gray-600 group-hover:text-blue-600 transition-colors shadow-sm">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 mb-0.5">{label}</p>
          <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
