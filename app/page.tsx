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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { ArrowUpRight, Users, UserCheck, ClipboardCheck } from "lucide-react";
import Link from "next/link";

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
  // Remove any non-numeric characters
  const numericPart = yearStr.replace(/\D/g, '');
  return parseInt(numericPart) || 0;
};

export default function HomePage() {
  const [year, setYear] = useState<string>("");
  const [yearList, setYearList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tcasData, setTcasData] = useState<TCASData[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalApplicants: 0,
    totalQualified: 0,
    totalRegistered: 0,
    avgRegistrationRate: 0
  });

  // ดึงรายการปีที่มีข้อมูล
  useEffect(() => {
    fetch('/api/tcas/years')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch years');
        return res.json();
      })
      .then((data: YearData[]) => {
        // แปลงเป็น array ของปี
        const years = data.map(item => item.year);
        
        // เรียงปีจากมากไปน้อย (ล่าสุดอยู่ต้น array)
        years.sort((a, b) => {
          const yearA = thaiYearToNumber(a);
          const yearB = thaiYearToNumber(b);
          return yearB - yearA; // เรียงจากมากไปน้อย
        });
        
        setYearList(years);
        if (years.length > 0) {
          // เลือกปีล่าสุดเสมอ
          setYear(years[0]);
        }
      })
      .catch(() => {
        // ถ้าไม่มี API ให้ใช้ปีตัวอย่าง
        const sampleYears = ["2568", "2567", "2566", "2565"];
        setYearList(sampleYears);
        setYear(sampleYears[0]); // เลือกปีล่าสุด (2568)
      })
      .finally(() => setLoading(false));
  }, []);

  // ดึงข้อมูลสรุปของทุก TCAS เมื่อปีเปลี่ยน
  useEffect(() => {
    if (!year) return;

    const fetchAllTCASData = async () => {
      setLoading(true);
      try {
        const tables = ['tcas_1', 'tcas_2', 'tcas_3', 'tcas_4'];
        const promises = tables.map(table => 
          fetch(`/api/tcas/${table}/summary?year=${year}`)
            .then(async (res) => {
              if (!res.ok) {
                console.error(`Failed to fetch ${table}: ${res.status}`);
                return null;
              }
              const data: RawTCASData = await res.json();
              
              // แปลงข้อมูลให้เป็นตัวเลข
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
              console.error(`Error fetching ${table}:`, error);
              return null;
            })
        );

        const results = await Promise.all(promises);
        // กรองเฉพาะข้อมูลที่ valid และมีโครงสร้างถูกต้อง
        const validData = results.filter((data): data is TCASData => {
          if (!data) return false;
          if (typeof data.table !== 'string' || data.table.trim() === '') return false;
          if (typeof data.year !== 'string' || data.year.trim() === '') return false;
          return true;
        });
        
        console.log("Fetched TCAS data:", validData); // สำหรับ debug
        
        setTcasData(validData);

        // คำนวณสถิติรวม
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
          
          const avgRegistrationRate = validData.length > 0 
            ? validData.reduce((sum, item) => {
                const rate = Number(item.registration_rate);
                return sum + (isNaN(rate) ? 0 : rate);
              }, 0) / validData.length
            : 0;

          console.log("Calculated stats:", { totalApplicants, totalQualified, totalRegistered, avgRegistrationRate }); // สำหรับ debug

          setOverallStats({
            totalApplicants,
            totalQualified,
            totalRegistered,
            avgRegistrationRate: Math.round(avgRegistrationRate)
          });
        } else {
          // ถ้าไม่มีข้อมูล ให้เซ็ตค่าเริ่มต้น
          setOverallStats({
            totalApplicants: 0,
            totalQualified: 0,
            totalRegistered: 0,
            avgRegistrationRate: 0
          });
        }
      } catch (error) {
        console.error("Error fetching TCAS data:", error);
        setTcasData([]);
        setOverallStats({
          totalApplicants: 0,
          totalQualified: 0,
          totalRegistered: 0,
          avgRegistrationRate: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAllTCASData();
  }, [year]);

  // ข้อมูลสำหรับกราฟ
  const chartData = tcasData
    .filter(item => item && item.table)
    .map(item => ({
      name: item.table.toUpperCase().replace('_', ' '),
      applicants: Number(item.total_applicants) || 0,
      registered: Number(item.total_registered) || 0,
      rate: Number(item.registration_rate) || 0
    }));

  // Top 10 สาขายอดนิยม
  const topDepartments = tcasData
    .filter(item => item && item.table && item.top_departments)
    .flatMap(item => 
      (item.top_departments || []).map(dept => ({
        ...dept,
        applicants: Number(dept.applicants) || 0,
        registered: Number(dept.registered) || 0,
        table: item.table
      }))
    )
    .sort((a, b) => b.applicants - a.applicants)
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6 md:p-10">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">TCAS Dashboard</h1>
            <p className="text-gray-600 mt-2">ระบบจัดการและวิเคราะห์ข้อมูลการรับสมัคร TCAS</p>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">ปีการศึกษา</span>
            <div className="w-36">
              <Select value={year} onValueChange={(val) => setYear(val)}>
                <SelectTrigger className="rounded-full border-gray-300">
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
        </div>

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
              <p className="text-xs text-gray-500 mt-1">จาก TCAS 1-4</p>
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
              <CardTitle className="text-sm font-medium">อัตราการรายงานตัวเฉลี่ย</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {overallStats.avgRegistrationRate}%
              </div>
              <p className="text-xs text-gray-500 mt-1">เฉลี่ยจาก TCAS 1-4</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: TCAS Overview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ภาพรวม TCAS 1-4</CardTitle>
              <CardDescription>เปรียบเทียบจำนวนผู้สมัครและผู้รายงานตัว</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-pulse text-gray-500">กำลังโหลดข้อมูล...</div>
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">ไม่มีข้อมูลสำหรับปี {year}</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [Number(value).toLocaleString(), "จำนวน"]}
                    />
                    <Legend />
                    <Bar 
                      dataKey="applicants" 
                      name="ผู้สมัคร" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="registered" 
                      name="รายงานตัว" 
                      fill="#10b981" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* TCAS Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['tcas_1', 'tcas_2', 'tcas_3', 'tcas_4'].map((table) => {
              const data = tcasData.find(item => item.table === table);
              const displayName = table.toUpperCase().replace('_', ' ');
              
              const applicants = Number(data?.total_applicants) || 0;
              const registered = Number(data?.total_registered) || 0;
              const rate = Number(data?.registration_rate) || 0;
              
              return (
                <Card key={table} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{displayName}</CardTitle>
                    <CardDescription>ปีการศึกษา {year}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">ผู้สมัคร</span>
                        <span className="font-semibold">
                          {applicants > 0 ? applicants.toLocaleString() : "0"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">รายงานตัว</span>
                        <span className="font-semibold">
                          {registered > 0 ? registered.toLocaleString() : "0"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">อัตรารายงานตัว</span>
                        <span className="font-semibold text-green-600">
                          {rate > 0 ? `${Math.round(rate)}%` : "0%"}
                        </span>
                      </div>
                      <Link href={`/tcas/${table}`} className="block">
                        <Button variant="outline" className="w-full mt-2" size="sm">
                          ดูรายละเอียด <ArrowUpRight className="ml-2 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Column: Additional Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>อัตราการรายงานตัวตามรอบ TCAS</CardTitle>
              <CardDescription>เปรียบเทียบอัตราการรายงานตัว</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-pulse text-gray-500">กำลังโหลดข้อมูล...</div>
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">ไม่มีข้อมูลสำหรับปี {year}</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${Math.round(Number(value))}%`, "อัตรา"]} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      name="อัตรารายงานตัว (%)" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>สาขายอดนิยม 10 อันดับแรก</CardTitle>
              <CardDescription>เรียงตามจำนวนผู้สมัคร</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topDepartments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    ไม่มีข้อมูลสาขายอดนิยมสำหรับปี {year}
                  </div>
                ) : (
                  topDepartments.map((dept, index) => {
                    const applicants = Number(dept.applicants) || 0;
                    const tableName = dept.table?.toUpperCase().replace('_', ' ') || '';
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-medium">
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{dept.name}</div>
                            <div className="text-xs text-gray-500 truncate">{tableName}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{applicants > 0 ? applicants.toLocaleString() : "0"}</div>
                          <div className="text-xs text-gray-500">ผู้สมัคร</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}