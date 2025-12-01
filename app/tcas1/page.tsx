"use client";

import { useState, useEffect } from "react";
import TableTCAS from "./components/tc1_table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/customized/select/select";

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
    <div className="p-10 space-y-6">
      <div className="flex items-center gap-10">
        <h1 className="text-2xl font-bold">TCAS1</h1>

        <div className="w-36">
          <Select value={year} onValueChange={(val) => setYear(val)}>
            <SelectTrigger className="rounded-full">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Year</SelectLabel>
                {yearList.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {year && <TableTCAS year={year} />}
    </div>
  );
}
