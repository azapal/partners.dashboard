/* eslint-disable @typescript-eslint/no-explicit-any */

import { json2csv } from "json-2-csv";

export const convertToCSV = (jsonData: { [key: string]: any }[]) => {
  const csv = json2csv(jsonData);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "data.csv";
  link.click();
};
