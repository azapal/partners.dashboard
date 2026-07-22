export type RouteStatus = "Active" | "Paired" | "Pending";
export type CargoType =
  | "General Goods"
  | "Food & Perishables"
  | "Electronics"
  | "Documents"
  | "Furniture"
  | "Pharmaceuticals";
export type Frequency = "One-time" | "Daily" | "Weekly" | "Monthly";
export type PairingStatus = "upcoming" | "successful" | "disputed";

export interface LogisticsRoute {
  id: string;
  businessName: string;
  originState: string;
  originAddress: string;
  destinationState: string;
  destinationAddress: string;
  cargoType: CargoType;
  frequency: Frequency;
  preferredDate: string;
  status: RouteStatus;
  createdAt: string;
}

export interface PairedDelivery {
  id: string;
  routeId: string;
  originState: string;
  destinationState: string;
  partnerBusiness: string;
  partnerInitials: string;
  matchScore: number;
  cargoType: CargoType;
  scheduledDate: string;
  status: PairingStatus;
  costSaving: number;
  distanceKm: number;
  completedDate?: string;
  disputeReason?: string;
  disputeRaisedBy?: string;
}

export const CARGO_TYPES: CargoType[] = [
  "General Goods",
  "Food & Perishables",
  "Electronics",
  "Documents",
  "Furniture",
  "Pharmaceuticals",
];

export const FREQUENCIES: Frequency[] = ["One-time", "Daily", "Weekly", "Monthly"];

export const dummyRoutes: LogisticsRoute[] = [
  {
    id: "RT-1001",
    businessName: "Greenline Foods",
    originState: "Abuja",
    originAddress: "Wuse Zone 4 Depot",
    destinationState: "Lagos",
    destinationAddress: "Ikeja Distribution Yard",
    cargoType: "Food & Perishables",
    frequency: "Weekly",
    preferredDate: "2026-07-15",
    status: "Paired",
    createdAt: "2026-06-28",
  },
  {
    id: "RT-1002",
    businessName: "Nova Electronics Ltd",
    originState: "Abuja",
    originAddress: "Garki Warehouse 3",
    destinationState: "Lagos",
    destinationAddress: "Computer Village, Ikeja",
    cargoType: "Electronics",
    frequency: "Monthly",
    preferredDate: "2026-07-18",
    status: "Paired",
    createdAt: "2026-06-30",
  },
  {
    id: "RT-1003",
    businessName: "Amaka Textiles",
    originState: "Kano",
    originAddress: "Kantin Kwari Market",
    destinationState: "Lagos",
    destinationAddress: "Balogun Market, Lagos Island",
    cargoType: "General Goods",
    frequency: "Weekly",
    preferredDate: "2026-07-14",
    status: "Active",
    createdAt: "2026-07-01",
  },
  {
    id: "RT-1004",
    businessName: "MedPlus Pharma",
    originState: "Abuja",
    originAddress: "Central Business District",
    destinationState: "Port Harcourt",
    destinationAddress: "Trans Amadi Industrial Layout",
    cargoType: "Pharmaceuticals",
    frequency: "One-time",
    preferredDate: "2026-07-20",
    status: "Pending",
    createdAt: "2026-07-04",
  },
  {
    id: "RT-1005",
    businessName: "Bright Homes Furniture",
    originState: "Lagos",
    originAddress: "Ojo Industrial Estate",
    destinationState: "Abuja",
    destinationAddress: "Lugbe Showroom",
    cargoType: "Furniture",
    frequency: "One-time",
    preferredDate: "2026-06-22",
    status: "Paired",
    createdAt: "2026-06-10",
  },
  {
    id: "RT-1006",
    businessName: "Zenith Legal Services",
    originState: "Abuja",
    originAddress: "Maitama Office Complex",
    destinationState: "Lagos",
    destinationAddress: "Victoria Island Annex",
    cargoType: "Documents",
    frequency: "Daily",
    preferredDate: "2026-07-13",
    status: "Active",
    createdAt: "2026-07-05",
  },
  {
    id: "RT-1007",
    businessName: "Sunrise Grains Co.",
    originState: "Kaduna",
    originAddress: "Sabon Gari Grain Market",
    destinationState: "Abuja",
    destinationAddress: "Dei-Dei Market",
    cargoType: "Food & Perishables",
    frequency: "Weekly",
    preferredDate: "2026-06-18",
    status: "Paired",
    createdAt: "2026-06-02",
  },
  {
    id: "RT-1008",
    businessName: "Ibadan AgroChem",
    originState: "Oyo",
    originAddress: "Bodija Industrial Estate",
    destinationState: "Lagos",
    destinationAddress: "Apapa Port Warehouse",
    cargoType: "General Goods",
    frequency: "Monthly",
    preferredDate: "2026-06-25",
    status: "Pending",
    createdAt: "2026-06-15",
  },
];

export const dummyPairedDeliveries: PairedDelivery[] = [
  {
    id: "PD-2001",
    routeId: "RT-1001",
    originState: "Abuja",
    destinationState: "Lagos",
    partnerBusiness: "Coastal Fresh Distributors",
    partnerInitials: "CF",
    matchScore: 94,
    cargoType: "Food & Perishables",
    scheduledDate: "2026-07-15",
    status: "upcoming",
    costSaving: 18500,
    distanceKm: 756,
  },
  {
    id: "PD-2002",
    routeId: "RT-1002",
    originState: "Abuja",
    destinationState: "Lagos",
    partnerBusiness: "Circuit City Traders",
    partnerInitials: "CC",
    matchScore: 88,
    cargoType: "Electronics",
    scheduledDate: "2026-07-18",
    status: "upcoming",
    costSaving: 24000,
    distanceKm: 756,
  },
  {
    id: "PD-2003",
    routeId: "RT-1006",
    originState: "Abuja",
    destinationState: "Lagos",
    partnerBusiness: "Apex Courier Partners",
    partnerInitials: "AC",
    matchScore: 91,
    cargoType: "Documents",
    scheduledDate: "2026-07-13",
    status: "upcoming",
    costSaving: 6200,
    distanceKm: 756,
  },
  {
    id: "PD-2004",
    routeId: "RT-1004",
    originState: "Abuja",
    destinationState: "Port Harcourt",
    partnerBusiness: "Niger Delta Meds Ltd",
    partnerInitials: "ND",
    matchScore: 79,
    cargoType: "Pharmaceuticals",
    scheduledDate: "2026-07-20",
    status: "upcoming",
    costSaving: 15800,
    distanceKm: 610,
  },
  {
    id: "PD-2005",
    routeId: "RT-1005",
    originState: "Lagos",
    destinationState: "Abuja",
    partnerBusiness: "Capital Interiors",
    partnerInitials: "CI",
    matchScore: 96,
    cargoType: "Furniture",
    scheduledDate: "2026-06-22",
    status: "successful",
    costSaving: 32500,
    distanceKm: 756,
    completedDate: "2026-06-23",
  },
  {
    id: "PD-2006",
    routeId: "RT-1007",
    originState: "Kaduna",
    destinationState: "Abuja",
    partnerBusiness: "Northern Harvest Traders",
    partnerInitials: "NH",
    matchScore: 90,
    cargoType: "Food & Perishables",
    scheduledDate: "2026-06-18",
    status: "successful",
    costSaving: 11200,
    distanceKm: 205,
    completedDate: "2026-06-19",
  },
  {
    id: "PD-2007",
    routeId: "RT-1007",
    originState: "Kaduna",
    destinationState: "Abuja",
    partnerBusiness: "Sahel Produce Hub",
    partnerInitials: "SP",
    matchScore: 85,
    cargoType: "Food & Perishables",
    scheduledDate: "2026-06-04",
    status: "successful",
    costSaving: 9800,
    distanceKm: 205,
    completedDate: "2026-06-05",
  },
  {
    id: "PD-2008",
    routeId: "RT-1008",
    originState: "Oyo",
    destinationState: "Lagos",
    partnerBusiness: "Apapa Bulk Movers",
    partnerInitials: "AB",
    matchScore: 82,
    cargoType: "General Goods",
    scheduledDate: "2026-06-25",
    status: "disputed",
    costSaving: 14300,
    distanceKm: 128,
    disputeReason: "Partner vehicle arrived 6 hours late, causing a missed pickup window.",
    disputeRaisedBy: "You",
  },
  {
    id: "PD-2009",
    routeId: "RT-1003",
    originState: "Kano",
    destinationState: "Lagos",
    partnerBusiness: "Sabon Gari Movers",
    partnerInitials: "SG",
    matchScore: 76,
    cargoType: "General Goods",
    scheduledDate: "2026-06-30",
    status: "disputed",
    costSaving: 21000,
    distanceKm: 1020,
    disputeReason: "Discrepancy in shared cost split — partner billed for full trip.",
    disputeRaisedBy: "Partner",
  },
];
