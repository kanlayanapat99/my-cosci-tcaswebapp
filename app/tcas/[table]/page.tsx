// app/[table]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import TableTCAS from "../components/tc_table";
import DashboardTCAS from "../components/tc_dashboard";
import SchoolsTCAS from "../components/tc_schools";
import PageTransition from "@/components/ui/pageTransition";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/customized/select/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { X, Filter, Calendar, BookOpen, School, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/customized/alert/alert";


type YearItem = { year: string };

export default function Page() {
  const params = useParams();
  const table = params.table as string;
  
  // State สำหรับ years และ major
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedMajor, setSelectedMajor] = useState<string>("all");
  const [yearList, setYearList] = useState<string[]>([]);
  const [majorList, setMajorList] = useState<string[]>([]);
  const [searchMajor, setSearchMajor] = useState<string>("");

  // Fetch years เมื่อ table เปลี่ยน
  useEffect(() => {
    fetch(`/api/tcas/${table}/years`)
      .then(res => res.json())
      .then((data: YearItem[]) => {
        const years = data.map(item => item.year);
        setYearList(years);
        // Auto-select latest 3 years หรือทั้งหมดถ้าน้อยกว่า 3 ปี
        if (years.length > 0) {
          const latestYears = years.slice(0, Math.min(3, years.length));
          setSelectedYears(latestYears);
        }
      });
  }, [table]);

  // Fetch majors เมื่อ selectedYears เปลี่ยน
  useEffect(() => {
    if (selectedYears.length > 0) {
      const yearsParam = selectedYears.join(',');
      fetch(`/api/tcas/${table}/majors?years=${yearsParam}`)
        .then(res => res.json())
        .then((data: string[]) => {
          setMajorList(['all', ...data]);
        });
    }
  }, [table, selectedYears]);

  // Handler สำหรับเลือกปี
  const handleYearSelect = (year: string) => {
    if (selectedYears.includes(year)) {
      setSelectedYears(selectedYears.filter(y => y !== year));
    } else {
      setSelectedYears([...selectedYears, year]);
    }
  };

  // Handler สำหรับเลือกทุกปี
  const selectAllYears = () => {
    setSelectedYears([...yearList]);
  };

  // Handler สำหรับล้างปีทั้งหมด
  const clearAllYears = () => {
    setSelectedYears([]);
  };

  // Filter majors ตาม search input
  const filteredMajors = majorList.filter(major =>
    major.toLowerCase().includes(searchMajor.toLowerCase())
  );

  const displayName = table.toUpperCase().replace('_', ' ');

  return (
    <PageTransition>
      <div className="p-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{displayName}</h1>
          
          <div className="flex items-center gap-4">
            {/* Year Filter */}
            <div className="relative">
              <Select>
                <SelectTrigger className="w-48 rounded-full">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {selectedYears.length === 0
                        ? "Select Years"
                        : `${selectedYears.length} Year${selectedYears.length > 1 ? 's' : ''}`}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent className="w-64">
                  <SelectGroup>
                    <div className="p-2 border-b">
                      <div className="flex justify-between items-center mb-2">
                        <SelectLabel>Years</SelectLabel>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={selectAllYears}
                            className="h-7 text-xs"
                          >
                            All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearAllYears}
                            className="h-7 text-xs"
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {yearList.map((year) => (
                          <div
                            key={year}
                            className="flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer"
                            onClick={() => handleYearSelect(year)}
                          >
                            <span>{year}</span>
                            {selectedYears.includes(year) && (
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </SelectGroup>
                </SelectContent>
              </Select>
              
            </div>

            {/* Major Filter */}
            <div className="relative">
              <Select value={selectedMajor} onValueChange={setSelectedMajor}>
                <SelectTrigger className="w-48 rounded-full">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>
                      {selectedMajor === "all" ? "All Majors" : selectedMajor}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent className="w-64">
                  <SelectGroup>
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Search major..."
                        value={searchMajor}
                        onChange={(e) => setSearchMajor(e.target.value)}
                        className="mb-2"
                      />
                      <SelectLabel>Majors</SelectLabel>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredMajors.map((major) => (
                        <SelectItem key={major} value={major}>
                          {major === "all" ? "All Majors" : major}
                        </SelectItem>
                      ))}
                    </div>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Display Selected Filters */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <Filter className="h-5 w-5" />
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="px-3 py-1">
              Table: {displayName}
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              Years: {selectedYears.length > 0 
                ? selectedYears.join(", ") 
                : "None selected"}
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              Major: {selectedMajor === "all" ? "All" : selectedMajor}
            </Badge>
          </div>
        </div>

        {/* Main Content - แสดงทั้ง 3 ส่วนเรียงต่อกัน */}
        <div className="space-y-8">
          {/* Dashboard Section */}
          {selectedYears.length > 0 ? (
            <>
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <div className="w-2 h-6 bg-blue-500 rounded"></div>
                  Dashboard Overview
                </h2>
                <DashboardTCAS 
                  table={table} 
                  years={selectedYears} 
                  major={selectedMajor} 
                />
              </div>

              {/* Table Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <div className="w-2 h-6 bg-purple-500 rounded"></div>
                  Detailed Table Data
                </h2>
                <TableTCAS 
                  table={table} 
                  years={selectedYears} 
                  major={selectedMajor} 
                />
              </div>

              {/* Schools Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <div className="w-2 h-6 bg-green-500 rounded"></div>
                  School Information
                </h2>
                <SchoolsTCAS table={table} title="อันดับโรงเรียน" />
              </div>

            </>
          ) : (
            <div className="text-center p-12 border rounded-lg bg-yellow-50">
              <Calendar className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-yellow-800 mb-2">No Years Selected</h3>
              <p className="text-yellow-700 mb-4">
                Please select at least one year to view the data
              </p>
              <Button onClick={selectAllYears} variant="outline">
                Select All Available Years
              </Button>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}