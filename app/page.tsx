// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/customized/select/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { ArrowUpRight, Users, UserCheck, ClipboardCheck, Target, Calendar, Filter, BarChart3 } from "lucide-react";
import Link from "next/link";
import SchoolsTCAS from "@/app/tcas/components/tc_schools";

type TCASData = {
  table: string;
  year: string;
  total_applicants: number;
  total_qualified: number;
  total_registered: number;
  registration_rate: number;
  top_departments: Array<{
    name: string;
    applicants: number;
    registered: number;
  }>;
};

type YearData = {
  year: string;
};

type Department = {
  name: string;
  applicants: number | string;
  registered: number | string;
};

type RawTCASData = {
  table: string;
  year: string;
  total_applicants: number | string;
  total_qualified: number | string;
  total_registered: number | string;
  registration_rate: number | string;
  top_departments: Department[];
};

// Helper function to safely parse numbers
const safeParseNumber = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Function to convert Thai year to number for sorting
const thaiYearToNumber = (yearStr: string): number => {
  const numericPart = yearStr.replace(/\D/g, '');
  return parseInt(numericPart) || 0;
};

// Function to get color based on TCAS round
const getTcasColor = (tcas: string) => {
  switch(tcas) {
    case 'tcas_1': return '#3b82f6'; // Blue
    case 'tcas_2': return '#10b981'; // Green
    case 'tcas_3': return '#f59e0b'; // Orange
    case 'tcas_4': return '#8b5cf6'; // Purple
    default: return '#6b7280'; // Gray
  }
};

// Interface สำหรับ Year Card Data
interface YearCardData {
  year: string;
  totalApplicants: number;
  totalRegistered: number;
  totalQuota: number;
  tcas1?: TCASData;
  tcas2?: TCASData;
  tcas3?: TCASData;
  tcas4?: TCASData;
  topDepartments: Array<{
    name: string;
    applicants: number;
    registered: number;
    table: string;
  }>;
}

export default function HomePage() {
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [yearList, setYearList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tcasData, setTcasData] = useState<TCASData[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalApplicants: 0,
    totalQualified: 0,
    totalRegistered: 0,
    totalQuota: 0
  });
  const [activeTab, setActiveTab] = useState<string>("applicants");

  // ดึงรายการปีที่มีข้อมูล
  useEffect(() => {
    fetch('/api/tcas/years')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch years');
        return res.json();
      })
      .then((data: YearData[]) => {
        const years = data.map(item => item.year);
        years.sort((a, b) => {
          const yearA = thaiYearToNumber(a);
          const yearB = thaiYearToNumber(b);
          return yearB - yearA;
        });
        
        setYearList(years);
        if (years.length > 0) {
          // เลือก 3 ปีล่าสุดเป็นค่าเริ่มต้น
          const initialYears = years.slice(0, Math.min(3, years.length));
          setSelectedYears(initialYears);
        }
      })
      .catch(() => {
        const sampleYears = ["2568", "2567", "2566", "2565", "2564"];
        setYearList(sampleYears);
        setSelectedYears(sampleYears.slice(0, 3));
      })
      .finally(() => setLoading(false));
  }, []);

  // ดึงข้อมูลสรุปของทุก TCAS เมื่อปีที่เลือกเปลี่ยน
  useEffect(() => {
    if (selectedYears.length === 0) return;

    const fetchAllTCASData = async () => {
      setLoading(true);
      try {
        const tables = ['tcas_1', 'tcas_2', 'tcas_3', 'tcas_4'];
        
        const promises = selectedYears.flatMap(year => 
          tables.map(table => 
            fetch(`/api/tcas/${table}/summary?year=${year}`)
              .then(async (res) => {
                if (!res.ok) {
                  console.error(`Failed to fetch ${table} for year ${year}: ${res.status}`);
                  return null;
                }
                const data: RawTCASData = await res.json();
                
                return {
                  ...data,
                  total_applicants: safeParseNumber(data.total_applicants),
                  total_qualified: safeParseNumber(data.total_qualified),
                  total_registered: safeParseNumber(data.total_registered),
                  registration_rate: safeParseNumber(data.registration_rate),
                  top_departments: (data.top_departments || []).map((dept: Department) => ({
                    ...dept,
                    applicants: safeParseNumber(dept.applicants),
                    registered: safeParseNumber(dept.registered)
                  }))
                } as TCASData;
              })
              .catch((error) => {
                console.error(`Error fetching ${table} for year ${year}:`, error);
                return null;
              })
          )
        );
        

        const results = await Promise.all(promises);
        const validData = results.filter((data): data is TCASData => {
          if (!data) return false;
          if (typeof data.table !== 'string' || data.table.trim() === '') return false;
          if (typeof data.year !== 'string' || data.year.trim() === '') return false;
          return true;
        });
        
        setTcasData(validData);

        // คำนวณสถิติรวมจากทุกปีที่เลือก
        if (validData.length > 0) {
          const totalApplicants = validData.reduce((sum, item) => {
            const applicants = Number(item.total_applicants);
            return sum + (isNaN(applicants) ? 0 : applicants);
          }, 0);
          
          const totalQualified = validData.reduce((sum, item) => {
            const qualified = Number(item.total_qualified);
            return sum + (isNaN(qualified) ? 0 : qualified);
          }, 0);
          
          const totalRegistered = validData.reduce((sum, item) => {
            const registered = Number(item.total_registered);
            return sum + (isNaN(registered) ? 0 : registered);
          }, 0);
          
          const totalQuota = totalQualified;

          setOverallStats({
            totalApplicants,
            totalQualified,
            totalRegistered,
            totalQuota
          });
        } else {
          setOverallStats({
            totalApplicants: 0,
            totalQualified: 0,
            totalRegistered: 0,
            totalQuota: 0
          });
        }
      } catch (error) {
        console.error("Error fetching TCAS data:", error);
        setTcasData([]);
        setOverallStats({
          totalApplicants: 0,
          totalQualified: 0,
          totalRegistered: 0,
          totalQuota: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAllTCASData();
  }, [selectedYears]);

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

  // Handler สำหรับเลือกปีล่าสุด 3 ปี
  const selectLatestYears = () => {
    const latestYears = yearList.slice(0, Math.min(3, yearList.length));
    setSelectedYears(latestYears);
  };

  // Handler สำหรับล้างปีทั้งหมด
  const clearAllYears = () => {
    setSelectedYears([]);
  };

  // ข้อมูลสำหรับกราฟแท่ง (รองรับหลายปี)
const barChartData = selectedYears.map(year => {
  const yearData = tcasData.filter(item => item.year === year);

  console.log("-------- CHECK --------");
  console.log("Select year:", year);
  console.log("TCAS DATA:", tcasData);
  console.log("yearData:", yearData);

  console.log(`Creating bar chart for year ${year}:`, yearData.map(d => ({
    table: d.table,
    applicants: d.total_applicants
  })));
  
  const tcas1 = yearData.find(item => item.table === 'tcas_1');
  const tcas2 = yearData.find(item => item.table === 'tcas_2');
  const tcas3 = yearData.find(item => item.table === 'tcas_3');
  const tcas4 = yearData.find(item => item.table === 'tcas_4');
  
  // ข้อมูลจริงจาก API
  const result = {
    year: year,
    'TCAS 1': tcas1 ? Number(tcas1.total_applicants) || 0 : 0,
    'TCAS 2': tcas2 ? Number(tcas2.total_applicants) || 0 : 0,
    'TCAS 3': tcas3 ? Number(tcas3.total_applicants) || 0 : 0,
    'TCAS 4': tcas4 ? Number(tcas4.total_applicants) || 0 : 0,
    'TCAS 1 Reg': tcas1 ? Number(tcas1.total_registered) || 0 : 0,
    'TCAS 2 Reg': tcas2 ? Number(tcas2.total_registered) || 0 : 0,
    'TCAS 3 Reg': tcas3 ? Number(tcas3.total_registered) || 0 : 0,
    'TCAS 4 Reg': tcas4 ? Number(tcas4.total_registered) || 0 : 0,
  };
  
  console.log(`Result for year ${year}:`, result);
  return result;
  
});

  // ข้อมูลสำหรับกราฟเส้น (เปรียบเทียบหลายปี)
  const lineChartData = selectedYears.map(year => {
    const yearData = tcasData.filter(item => item.year === year);
    
    const tcas1 = yearData.find(item => item.table === 'tcas_1');
    const tcas2 = yearData.find(item => item.table === 'tcas_2');
    const tcas3 = yearData.find(item => item.table === 'tcas_3');
    const tcas4 = yearData.find(item => item.table === 'tcas_4');
    
    return {
      year: year,
      'TCAS 1': tcas1 ? Number(tcas1.total_applicants) || 0 : 0,
      'TCAS 2': tcas2 ? Number(tcas2.total_applicants) || 0 : 0,
      'TCAS 3': tcas3 ? Number(tcas3.total_applicants) || 0 : 0,
      'TCAS 4': tcas4 ? Number(tcas4.total_applicants) || 0 : 0,
    };
  });

  // สร้างข้อมูลสำหรับการแสดงแนวนอนแยกตามปี
  const generateYearCardsData = (): YearCardData[] => {
    return selectedYears.map(year => {
      const yearData = tcasData.filter(item => item.year === year);
      
      // คำนวณสถิติสำหรับปีนี้
      const totalApplicants = yearData.reduce((sum, item) => sum + (Number(item.total_applicants) || 0), 0);
      const totalRegistered = yearData.reduce((sum, item) => sum + (Number(item.total_registered) || 0), 0);
      const totalQuota = yearData.reduce((sum, item) => sum + (Number(item.total_qualified) || 0), 0);
      
      // หาข้อมูลแต่ละ TCAS สำหรับปีนี้
      const tcas1 = yearData.find(item => item.table === 'tcas_1');
      const tcas2 = yearData.find(item => item.table === 'tcas_2');
      const tcas3 = yearData.find(item => item.table === 'tcas_3');
      const tcas4 = yearData.find(item => item.table === 'tcas_4');
      
      // หา Top Departments สำหรับปีนี้
      const topDepartments = tcasData
        .filter(item => item.year === year && item.top_departments)
        .flatMap(item => 
          (item.top_departments || []).map(dept => ({
            ...dept,
            applicants: Number(dept.applicants) || 0,
            registered: Number(dept.registered) || 0,
            table: item.table
          }))
        )
        .sort((a, b) => b.applicants - a.applicants)
        .slice(0, 5); // แสดงแค่ 5 อันดับแรกต่อปี
      
      return { 
        year, 
        totalApplicants, 
        totalRegistered, 
        totalQuota,
        tcas1,
        tcas2,
        tcas3,
        tcas4,
        topDepartments
      };
    });
  };

  const yearCardsData = generateYearCardsData();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6 md:p-10">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">TCAS Dashboard</h1>
            <p className="text-gray-600 mt-2">ระบบจัดการและวิเคราะห์ข้อมูลการรับสมัคร TCAS</p>
          </div>
          
          {/* Year Filter */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">ปีการศึกษา</span>
            <div className="relative">
              <Select>
                <SelectTrigger className="w-48 rounded-full">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {selectedYears.length === 0
                        ? "เลือกปีการศึกษา"
                        : selectedYears.length === yearList.length
                          ? "ทุกปี"
                          : `${selectedYears.length} ปี`}
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
                            disabled={yearList.length === 0 || selectedYears.length === yearList.length}
                          >
                            All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={selectLatestYears}
                            className="h-7 text-xs"
                            disabled={yearList.length === 0}
                          >
                            Latest 3
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearAllYears}
                            className="h-7 text-xs"
                            disabled={selectedYears.length === 0}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {yearList.map((year) => (
                          <div
                            key={year}
                            className={`flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer ${
                              selectedYears.includes(year) ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => handleYearSelect(year)}
                          >
                            <span>{year}</span>
                            {selectedYears.includes(year) && (
                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Selected Years Display */}
        {selectedYears.length > 0 && (
          <div className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-lg mt-4">
            <Filter className="h-5 w-5 text-blue-500" />
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="px-3 py-1 bg-white">
                ปีที่เลือก: {selectedYears.length === yearList.length ? "ทุกปี" : selectedYears.join(", ")}
              </Badge>
              <Badge variant="secondary" className="px-3 py-1">
                {selectedYears.length} ปี
              </Badge>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card className="bg-white border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                ผู้สมัครทั้งหมด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {overallStats.totalApplicants > 0 ? overallStats.totalApplicants.toLocaleString() : "0"}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {selectedYears.length === yearList.length ? "ทุกปี" : `ปี ${selectedYears.join(", ")}`}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-500" />
                ผ่านการคัดเลือก
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {overallStats.totalQualified > 0 ? overallStats.totalQualified.toLocaleString() : "0"}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {overallStats.totalApplicants > 0 
                  ? `${Math.round((overallStats.totalQualified / overallStats.totalApplicants) * 100)}% ของผู้สมัคร`
                  : "0% ของผู้สมัคร"
                }
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-purple-500" />
                รายงานตัว
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {overallStats.totalRegistered > 0 ? overallStats.totalRegistered.toLocaleString() : "0"}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {overallStats.totalApplicants > 0 
                  ? `${Math.round((overallStats.totalRegistered / overallStats.totalApplicants) * 100)}% ของผู้สมัคร`
                  : "0% ของผู้สมัคร"
                }
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-orange-500" />
                โควตา
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {overallStats.totalQuota > 0 ? overallStats.totalQuota.toLocaleString() : "0"}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {selectedYears.length === yearList.length ? "ทุกปี" : `ปี ${selectedYears.join(", ")}`}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">

        {/* Bar Chart Section - เทียบผู้สมัคร 4 รอบ TCAS แยกตามปี */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              จำนวนผู้สมัคร TCAS ทั้ง 4 รอบ
            </CardTitle>
            <CardDescription>
              เปรียบเทียบจำนวนผู้สมัครในแต่ละรอบ TCAS
              {selectedYears.length > 0 && ` — ปีการศึกษา ${selectedYears.join(", ")}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-pulse text-gray-500">กำลังโหลดข้อมูล...</div>
              </div>
            ) : barChartData.length === 0 || selectedYears.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">ไม่มีข้อมูลสำหรับปีที่เลือก</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barChartData}
                  margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="year"
                    label={{ value: "ปีการศึกษา", position: "insideBottom", offset: -10 }}
                  />
                  <YAxis
                    tickFormatter={(v) => v.toLocaleString()}
                    width={70}
                  />
                  <Tooltip
                    formatter={(value, name) => [Number(value).toLocaleString(), name]}
                    labelFormatter={(label) => `ปีการศึกษา ${label}`}
                  />
                  <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 10 }} />
                  <Bar dataKey="TCAS 1" name="TCAS 1" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={48} />
                  <Bar dataKey="TCAS 2" name="TCAS 2" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={48} />
                  <Bar dataKey="TCAS 3" name="TCAS 3" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={48} />
                  <Bar dataKey="TCAS 4" name="TCAS 4" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Line Chart Section */}
        <Card>
          <CardHeader>
            <CardTitle>แนวโน้มจำนวนผู้สมัครตามปี</CardTitle>
            <CardDescription>เปรียบเทียบแนวโน้มการเปลี่ยนแปลงจำนวนผู้สมัครในแต่ละรอบ TCAS</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-pulse text-gray-500">กำลังโหลดข้อมูล...</div>
              </div>
            ) : lineChartData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">ไม่มีข้อมูลสำหรับปีที่เลือก</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="year" 
                    label={{ value: 'ปีการศึกษา', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [Number(value).toLocaleString(), "จำนวนผู้สมัคร"]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="TCAS 1" 
                    name="TCAS 1" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="TCAS 2" 
                    name="TCAS 2" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="TCAS 3" 
                    name="TCAS 3" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="TCAS 4" 
                    name="TCAS 4" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* School Ranking Section */}
        <section id="schools">
          <SchoolsTCAS />
        </section>

        {/* Year-wise Cards Section */}
        {selectedYears.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">ข้อมูลแยกตามปีการศึกษา</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {yearCardsData.map((yearData, index) => (
                <Card key={yearData.year} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">ปีการศึกษา {yearData.year}</CardTitle>
                        <CardDescription>ข้อมูลสรุปประจำปี</CardDescription>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {index + 1}/{selectedYears.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Year Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="text-sm font-medium text-blue-700">ผู้สมัคร</div>
                        <div className="text-lg font-bold">{yearData.totalApplicants.toLocaleString()}</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="text-sm font-medium text-green-700">รายงานตัว</div>
                        <div className="text-lg font-bold">{yearData.totalRegistered.toLocaleString()}</div>
                      </div>
                      <div className="text-center p-2 bg-orange-50 rounded">
                        <div className="text-sm font-medium text-orange-700">โควตา</div>
                        <div className="text-lg font-bold">{yearData.totalQuota.toLocaleString()}</div>
                      </div>
                    </div>

                    {/* TCAS Details */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-gray-700">รายละเอียดแต่ละรอบ</h4>
                      {[
                        { key: 'tcas1', label: 'TCAS 1' },
                        { key: 'tcas2', label: 'TCAS 2' },
                        { key: 'tcas3', label: 'TCAS 3' },
                        { key: 'tcas4', label: 'TCAS 4' }
                      ].map(({ key, label }) => {
                        const data = yearData[key as keyof typeof yearData];
                        if (!data || typeof data === 'string' || typeof data === 'number' || Array.isArray(data)) {
                          return null;
                        }
                        
                        const tcasData = data as TCASData;
                        const applicants = Number(tcasData.total_applicants) || 0;
                        const registered = Number(tcasData.total_registered) || 0;
                        const rate = Number(tcasData.registration_rate) || 0;
                        
                        return (
                          <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-8 rounded" 
                                style={{ backgroundColor: getTcasColor(key) }}
                              />
                              <span className="text-sm font-medium">{label}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">{applicants.toLocaleString()}</div>
                              <div className="text-xs text-gray-500">ผู้สมัคร</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Top Departments */}
                    {yearData.topDepartments.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-700">สาขายอดนิยม 5 อันดับ</h4>
                        <div className="space-y-1">
                          {yearData.topDepartments.map((dept, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs p-1 hover:bg-gray-50 rounded">
                              <span className="truncate flex-1 mr-2">{dept.name}</span>
                              <span className="font-medium whitespace-nowrap">
                                {Number(dept.applicants).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* View Details Link */}
                    <Link href={`/tcas?year=${yearData.year}`} className="block">
                      <Button variant="outline" className="w-full" size="sm">
                        ดูรายละเอียดปี {yearData.year} <ArrowUpRight className="ml-2 h-3 w-3" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TCAS Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>เข้าถึงข้อมูล TCAS แต่ละรอบ</CardTitle>
            <CardDescription>คลิกเพื่อดูข้อมูลละเอียดของแต่ละรอบ TCAS</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {['tcas_1', 'tcas_2', 'tcas_3', 'tcas_4'].map((table) => {
                const displayName = table.toUpperCase().replace('_', ' ');
                const color = getTcasColor(table);
                
                return (
                  <Link key={table} href={`/tcas/${table}`}>
                    <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer border-2 border-transparent hover:border-gray-200">
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center space-y-3">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${color}20` }}
                          >
                            <BarChart3 className="h-6 w-6" style={{ color }} />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{displayName}</h3>
                            <p className="text-sm text-gray-500">ข้อมูลละเอียด</p>
                          </div>
                          <div className="flex items-center text-sm text-blue-600">
                            <span>ดูข้อมูล</span>
                            <ArrowUpRight className="ml-1 h-3 w-3" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}