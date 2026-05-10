import { Compass, Truck, CreditCard, ShieldCheck } from "lucide-react";

export const helpData = [
  {
    icon: Compass,
    header: "Getting Started",
    items: [
      {
        itemTopic: "How to create your first delivery",
        itemInfo: "Your first delivery...",
      },
      {
        itemTopic: "Setting up your company profile",
        itemInfo: "Complete your company profile...",
      },
      {
        itemTopic: "Understanding the dashboard",
        itemInfo: "Your dashboard provides an overview...",
      },
    ],
  },
  {
    icon: Truck,
    header: "Delivery Management",
    items: [
      {
        itemTopic: "Tracking your deliveries",
        itemInfo: "Track all your deliveries in real-time...",
      },
      {
        itemTopic: "Managing delivery schedules",
        itemInfo: "Schedule deliveries efficiently...",
      },
      {
        itemTopic: "Handling delivery issues",
        itemInfo: "Learn how to handle common issues...",
      },
    ],
  },
  {
    icon: CreditCard,
    header: "Billing & Payments",
    items: [
      {
        itemTopic: "Understanding pricing",
        itemInfo: "Our pricing is transparent...",
      },
      {
        itemTopic: "Payment methods",
        itemInfo: "We accept various payment methods...",
      },
      {
        itemTopic: "Invoices and receipts",
        itemInfo: "Access all your invoices...",
      },
    ],
  },
  {
    icon: ShieldCheck,
    header: "Security & Privacy",
    items: [
      {
        itemTopic: "Account security best practices",
        itemInfo: "Keep your account secure...",
      },
      {
        itemTopic: "Data privacy policy",
        itemInfo: "Learn how we protect your data...",
      },
      {
        itemTopic: "Two-factor authentication setup",
        itemInfo: "Enhance your account security...",
      },
    ],
  },
];
