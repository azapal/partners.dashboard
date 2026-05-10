/* eslint-disable @typescript-eslint/no-explicit-any */
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
export type jsonDataDef = { [key: string]: any }[];
export const convertToExcel = (jsonData: jsonDataDef) => {
  const worksheet = XLSX.utils.json_to_sheet(jsonData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, "data.xlsx");
};
