// No backend endpoint exists yet for partner rate cards (confirmed — searched
// the whole service layer). Seeded and mutated client-side only, following
// the same convention as logisticsNetwork.ts's "My Routes" tab, so swapping
// in a real ratesService/useRates hook later is a drop-in replacement.

import { CARGO_TYPES } from "./logisticsNetwork";
import type { CargoType } from "./logisticsNetwork";

export type RateStatus = "Active" | "Inactive";

export type DeliveryMethod = "Walk" | "Bicycle" | "Motorcycle" | "Car" | "Van" | "Truck";

export const DELIVERY_METHODS: DeliveryMethod[] = ["Walk", "Bicycle", "Motorcycle", "Car", "Van", "Truck"];

export interface RouteRate {
  id: string;
  originState: string;
  destinationState: string;
  cargoType: CargoType;
  price: number;
  status: RateStatus;
  createdAt: string;
}

export interface CargoTypeRate {
  id: string;
  cargoType: CargoType;
  basePrice: number;
  pricePerKg: number;
  status: RateStatus;
  createdAt: string;
}

export interface DeliveryMethodRate {
  id: string;
  method: DeliveryMethod;
  price: number;
  status: RateStatus;
  createdAt: string;
}

export const dummyRouteRates: RouteRate[] = [
  { id: "RR-1001", originState: "Lagos", destinationState: "Abuja", cargoType: "General Goods", price: 15000, status: "Active", createdAt: "2026-06-20" },
  { id: "RR-1002", originState: "Kano", destinationState: "Lagos", cargoType: "Food & Perishables", price: 22000, status: "Active", createdAt: "2026-06-22" },
  { id: "RR-1003", originState: "Abuja", destinationState: "Rivers", cargoType: "Electronics", price: 18500, status: "Active", createdAt: "2026-06-25" },
  { id: "RR-1004", originState: "Oyo", destinationState: "Lagos", cargoType: "General Goods", price: 9500, status: "Inactive", createdAt: "2026-07-01" },
];

export const dummyCargoTypeRates: CargoTypeRate[] = [
  { id: "CR-1001", cargoType: CARGO_TYPES[0], basePrice: 5000, pricePerKg: 400, status: "Active", createdAt: "2026-06-18" },
  { id: "CR-1002", cargoType: CARGO_TYPES[1], basePrice: 6500, pricePerKg: 550, status: "Active", createdAt: "2026-06-18" },
  { id: "CR-1003", cargoType: CARGO_TYPES[2], basePrice: 8000, pricePerKg: 700, status: "Active", createdAt: "2026-06-19" },
  { id: "CR-1004", cargoType: CARGO_TYPES[5], basePrice: 10000, pricePerKg: 900, status: "Inactive", createdAt: "2026-06-21" },
];

export const dummyDeliveryMethodRates: DeliveryMethodRate[] = [
  { id: "DR-1001", method: "Walk", price: 1500, status: "Active", createdAt: "2026-06-15" },
  { id: "DR-1002", method: "Motorcycle", price: 3500, status: "Active", createdAt: "2026-06-15" },
  { id: "DR-1003", method: "Van", price: 8000, status: "Active", createdAt: "2026-06-15" },
  { id: "DR-1004", method: "Truck", price: 15000, status: "Inactive", createdAt: "2026-06-20" },
];
