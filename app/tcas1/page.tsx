"use client";

import { useState, useEffect } from "react";
import TableTCAS from "./components/tc1_table";

type YearItem = { year: string };

export default function Page() {
  const [year, setYear] = useState<string>("");
  const [yearList, setYearList] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/tcas_1/years")
      .then(res => res.json())
      .then((data: YearItem[]) => {
        const years = data.map(item => item.year);
        setYearList(years);
        if (years.length > 0) setYear(years[0]);
      });
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-12">
        <h1 className="text-2xl font-bold">TCAS1</h1>
        <select
          className="border p-2 rounded"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        >
          {yearList.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {year && <TableTCAS year={year} />}
    </div>
  );
}
