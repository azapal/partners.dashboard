/* eslint-disable @typescript-eslint/no-explicit-any */
// import { toast } from "@/hooks/use-toast";
// import { QueryParams } from "@/model/request";
// import { DefaultResponse } from "@/model/response/default.response";
// import { AxiosError } from "axios";
import { clsx, type ClassValue } from "clsx";
// import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns an array of possible expiration years for a card.
 * Each year is returned as an object with `value` and `label` properties.
 * @param {number} numberOfYears - The number of future years to include (default is 10).
 * @returns {{ value: number, label: string }[]} - An array of possible expiration years as objects.
 */
// export const getPossibleExpirationYears = (
//   numberOfYears: number = 10
// ): { value: number; label: string }[] => {
//   const currentYear = new Date().getFullYear();
//   return Array.from({ length: numberOfYears }, (_, index) => {
//     const year = currentYear + index;
//     return { value: year, label: year.toString() };
//   });
// };
//
// export const getLocation = (): Promise<{
//   latitude: number;
//   longitude: number;
// }> => {
//   return new Promise((resolve) => {
//     if (!navigator.geolocation) {
//       resolve({ latitude: 0, longitude: 0 });
//     } else {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const { latitude, longitude } = position.coords;
//           resolve({ latitude, longitude });
//         },
//         () => resolve({ latitude: 0, longitude: 0 }),
//         { enableHighAccuracy: true }
//       );
//     }
//   });
// };

// export const generateDeviceId = () => {
//   const existingId = localStorage.getItem("deviceId");
//   if (existingId) return existingId;
//
//   const deviceId = crypto.randomUUID();
//   localStorage.setItem("deviceId", deviceId);
//   return deviceId;
// };
//
// export const formatDate = (date: string | undefined) =>
//   date ? format(new Date(date), "PPP") : "N/A";

// export const copyToClipboard = async (text: string): Promise<boolean> => {
//   try {
//     await navigator.clipboard.writeText(text);
//     return true;
//   } catch (err) {
//     console.error("Failed to copy: ", err);
//     return false;
//   }
// };
//
// export const toastError = (error: unknown) => {
//   if (
//     (error instanceof AxiosError &&
//       error.response?.data.message.includes("401")) ||
//     (typeof error === "string" && error.includes("401"))
//   ) {
//     return;
//   }
//
//   toast({
//     title: "Error",
//     description:
//       error instanceof AxiosError
//         ? error.response?.data.message
//         : error
//         ? error
//         : "An error occurred, please try again",
//     variant: "destructive",
//   });
// };
//
// export const toastMissingEntityData = () => {
//   toast({
//     title: "Error",
//     description: "Missing entity Data",
//     variant: "destructive",
//   });
// };
//
// export const isValidJSON = (str: string) => {
//   try {
//     JSON.parse(str);
//     return true;
//   } catch {
//     return false;
//   }
// };

// export const toastResponse = ({
//   responseCode,
//   responseMessage,
// }: DefaultResponse) => {
//   toast({
//     title: responseCode === "00" ? "Success" : "Error",
//     description: responseMessage,
//     variant: responseCode === "00" ? "success" : "destructive",
//   });
// };
//
// export const getFileExtension = (filename: string) => {
//   return filename.split(".").slice(1).join(".").toLowerCase();
// };
//
// export function convertSubscriptionDataToArray(data: string) {
//   try {
//     const parsed = JSON.parse(data);
//     return Object.entries(parsed).map(([key, value]) => ({
//       name: key,
//       value,
//     }));
//   } catch (e) {
//     console.error("Invalid JSON:", e);
//     return [];
//   }
// }
//
// export const formatCurrency = (value: string) => {
//   try {
//     value = value.replace(/[^0-9.]/g, ""); // Remove non-numeric characters except dot
//
//     // Prevent multiple decimal points
//     const dotCount = (value.match(/\./g) || []).length;
//     if (dotCount > 1) {
//       value = value.replace(/\.+$/, ""); // Remove extra dots
//     }
//
//     if (value) {
//       const parts = value.split(".");
//       parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ","); // Add commas to integer part
//
//       if (parts.length > 1) {
//         parts[1] = parts[1].slice(0, 2); // Limit to two decimal places
//       }
//
//       return parts.join(".");
//     }
//     return value;
//   } catch {
//     return value;
//   }
// };
//
// export const queryParamFormatter = (query?: QueryParams) =>
//   query ? `?${new URLSearchParams(query as any).toString()}` : "";
