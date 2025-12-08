// app/tcas/components/tc_schools.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { School, MapPin, Users, Building, Filter, Search, BarChart3 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/customized/select/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SchoolData {
  id: number;
  name: string;
  region: string;
  province: string;
  district?: string;
  applicants: number;
  year: string;
  major: string;
}

interface SchoolsTCASProps {
  table: string;
  years: string[];
  major?: string;
}

const THAI_REGIONS = [
  { id: 1, name: "ภาคเหนือ", color: "#3b82f6", provinces: ["เชียงใหม่", "เชียงราย", "ลำพูน", "ลำปาง", "พะเยา", "น่าน", "แพร่", "แม่ฮ่องสอน", "อุตรดิตถ์"] },
  { id: 2, name: "ภาคตะวันออกเฉียงเหนือ", color: "#10b981", provinces: ["ขอนแก่น", "อุดรธานี", "นครราชสีมา", "อุบลราชธานี", "สกลนคร", "ร้อยเอ็ด", "มหาสารคาม", "เลย", "บุรีรัมย์", "สุรินทร์", "ศรีสะเกษ", "หนองคาย", "หนองบัวลำภู", "มุกดาหาร", "ยโสธร", "อำนาจเจริญ", "บึงกาฬ"] },
  { id: 3, name: "ภาคกลาง", color: "#8b5cf6", provinces: ["กรุงเทพมหานคร", "นนทบุรี", "ปทุมธานี", "สมุทรปราการ", "สมุทรสาคร", "สมุทรสงคราม", "นครปฐม", "สุพรรณบุรี", "พระนครศรีอยุธยา", "ลพบุรี", "สระบุรี", "ชัยนาท", "สิงห์บุรี", "อ่างทอง", "นครนายก", "กาญจนบุรี", "ราชบุรี", "เพชรบุรี", "ประจวบคีรีขันธ์"] },
  { id: 4, name: "ภาคตะวันออก", color: "#f59e0b", provinces: ["ชลบุรี", "ระยอง", "จันทบุรี", "ตราด", "ฉะเชิงเทรา", "ปราจีนบุรี", "สระแก้ว"] },
  { id: 5, name: "ภาคตะวันตก", color: "#ef4444", provinces: ["กาญจนบุรี", "ราชบุรี", "เพชรบุรี", "ประจวบคีรีขันธ์"] },
  { id: 6, name: "ภาคใต้", color: "#06b6d4", provinces: ["นครศรีธรรมราช", "สุราษฎร์ธานี", "สงขลา", "พัทลุง", "ตรัง", "กระบี่", "ภูเก็ต", "ระนอง", "พังงา", "สตูล", "ยะลา", "ปัตตานี", "นราธิวาส"] },
];

const MOCK_SCHOOLS: SchoolData[] = [
  { id: 1, name: "โรงเรียนสวนกุหลาบวิทยาลัย", region: "ภาคกลาง", province: "กรุงเทพมหานคร", applicants: 45, year: "2565", major: "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร" },
  { id: 2, name: "โรงเรียนเตรียมอุดมศึกษา", region: "ภาคกลาง", province: "กรุงเทพมหานคร", applicants: 38, year: "2565", major: "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร" },
  { id: 3, name: "โรงเรียนมหิดลวิทยานุสรณ์", region: "ภาคกลาง", province: "นครปฐม", applicants: 32, year: "2565", major: "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร" },
  { id: 4, name: "โรงเรียนเบญจมราชูทิศ", region: "ภาคเหนือ", province: "เชียงใหม่", applicants: 28, year: "2565", major: "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร" },
  { id: 5, name: "โรงเรียนสิรินธร", region: "ภาคตะวันออกเฉียงเหนือ", province: "สุรินทร์", applicants: 22, year: "2565", major: "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร" },
  { id: 6, name: "โรงเรียนหาดใหญ่วิทยาลัย", region: "ภาคใต้", province: "สงขลา", applicants: 15, year: "2565", major: "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร" },
  { id: 7, name: "โรงเรียนสุรศักดิ์มนตรี", region: "ภาคกลาง", province: "กรุงเทพมหานคร", applicants: 18, year: "2565", major: "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร" },
  { id: 8, name: "โรงเรียนสตรีวิทยา ๒", region: "ภาคกลาง", province: "กรุงเทพมหานคร", applicants: 25, year: "2565", major: "วิชาเอกการออกแบบสื่อปฏิสัมพันธ์และมัลติมีเดีย" },
  { id: 9, name: "โรงเรียนสตรีนนทบุรี", region: "ภาคกลาง", province: "นนทบุรี", applicants: 20, year: "2565", major: "วิชาเอกการออกแบบสื่อปฏิสัมพันธ์และมัลติมีเดีย" },
  { id: 10, name: "โรงเรียนสตรีภูเก็ต", region: "ภาคใต้", province: "ภูเก็ต", applicants: 12, year: "2565", major: "วิชาเอกการออกแบบสื่อปฏิสัมพันธ์และมัลติมีเดีย" },
  { id: 11, name: "โรงเรียนอุดรพิทยานุกูล", region: "ภาคตะวันออกเฉียงเหนือ", province: "อุดรธานี", applicants: 30, year: "2566", major: "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร" },
  { id: 12, name: "โรงเรียนขอนแก่นวิทยายน", region: "ภาคตะวันออกเฉียงเหนือ", province: "ขอนแก่น", applicants: 27, year: "2566", major: "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร" },
  { id: 13, name: "โรงเรียนปทุมเทพวิทยาคาร", region: "ภาคตะวันออกเฉียงเหนือ", province: "หนองคาย", applicants: 21, year: "2566", major: "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร" },
  { id: 14, name: "โรงเรียนเลยพิทยาคม", region: "ภาคตะวันออกเฉียงเหนือ", province: "เลย", applicants: 19, year: "2566", major: "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร" },
  { id: 15, name: "โรงเรียนชลกันยานุกูล", region: "ภาคตะวันออก", province: "ชลบุรี", applicants: 24, year: "2566", major: "วิชาเอกการออกแบบสื่อปฏิสัมพันธ์และมัลติมีเดีย" },
  { id: 16, name: "โรงเรียนระยองวิทยาคม", region: "ภาคตะวันออก", province: "ระยอง", applicants: 17, year: "2566", major: "วิชาเอกการออกแบบสื่อปฏิสัมพันธ์และมัลติมีเดีย" },
  { id: 17, name: "โรงเรียนสามเสนวิทยาลัย", region: "ภาคกลาง", province: "กรุงเทพมหานคร", applicants: 35, year: "2565", major: "วิชาเอกการจัดการภาพยนตร์และสื่อดิจิทัล" },
  { id: 18, name: "โรงเรียนสตรีมหาพฤฒาราม", region: "ภาคกลาง", province: "กรุงเทพมหานคร", applicants: 30, year: "2565", major: "วิชาเอกการผลิตภาพยนตร์และสื่อดิจิทัล" },
  { id: 19, name: "โรงเรียนเทพศิรินทร์", region: "ภาคกลาง", province: "กรุงเทพมหานคร", applicants: 28, year: "2565", major: "วิชาเอกการสื่อสารเพื่อการจัดการนวัตกรรม" },
  { id: 20, name: "โรงเรียนศึกษานารี", region: "ภาคกลาง", province: "กรุงเทพมหานคร", applicants: 25, year: "2565", major: "วิชาเอกการสื่อสารเพื่อการท่องเที่ยว" },
  { id: 21, name: "โรงเรียนนวมินทราชูทิศ", region: "ภาคกลาง", province: "กรุงเทพมหานคร", applicants: 22, year: "2565", major: "วิชาเอกการสื่อสารเพื่อสุขภาพ" },
  { id: 22, name: "โรงเรียนพิษณุโลกพิทยาคม", region: "ภาคเหนือ", province: "พิษณุโลก", applicants: 14, year: "2566", major: "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร" },
  { id: 23, name: "โรงเรียนเฉลิมขวัญสตรี", region: "ภาคเหนือ", province: "พิษณุโลก", applicants: 11, year: "2566", major: "วิชาเอกการออกแบบสื่อปฏิสัมพันธ์และมัลติมีเดีย" },
  { id: 24, name: "โรงเรียนสตรียะลา", region: "ภาคใต้", province: "ยะลา", applicants: 8, year: "2566", major: "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร" },
  { id: 25, name: "โรงเรียนเบญจมราชาลัย", region: "ภาคกลาง", province: "กรุงเทพมหานคร", applicants: 16, year: "2565", major: "วิชาเอกการจัดการภาพยนตร์และสื่อดิจิทัล" },
  { id: 26, name: "โรงเรียนสารวิทยา", region: "ภาคกลาง", province: "กรุงเทพมหานคร", applicants: 19, year: "2565", major: "วิชาเอกการสื่อสารเพื่อสุขภาพ" },
  { id: 27, name: "โรงเรียนเทพสุวรรณชาญวิทยา", region: "ภาคตะวันตก", province: "ราชบุรี", applicants: 10, year: "2566", major: "วิชาเอกการจัดการภาพยนตร์และสื่อดิจิทัล" },
  { id: 28, name: "โรงเรียนเมืองเชลียง", region: "ภาคเหนือ", province: "สุโขทัย", applicants: 9, year: "2566", major: "วิชาเอกการออกแบบสื่อปฏิสัมพันธ์และมัลติมีเดีย" },
  { id: 29, name: "โรงเรียนเฉลิมพระเกียรติสมเด็จพระศรีนครินทร์", region: "ภาคตะวันออกเฉียงเหนือ", province: "กาฬสินธุ์", applicants: 13, year: "2565", major: "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร" },
  { id: 30, name: "โรงเรียนสวนศรีวิทยา", region: "ภาคใต้", province: "ชุมพร", applicants: 7, year: "2565", major: "วิชาเอกการสื่อสารเพื่อการท่องเที่ยว" },
];

export default function SchoolsTCAS({ table, years, major = "all" }: SchoolsTCASProps) {
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [viewMode, setViewMode] = useState<"list" | "stats">("stats");

  // ใช้ useMemo เพื่อคำนวณข้อมูลโรงเรียนจาก props
  const baseSchools = useMemo(() => {
    let filtered = MOCK_SCHOOLS;
    
    if (years && years.length > 0) {
      filtered = filtered.filter(school => years.includes(school.year));
    }
    
    if (major !== "all") {
      filtered = filtered.filter(school => school.major === major);
    }
    
    return filtered;
  }, [years, major]);

  // ใช้ useMemo เพื่อคำนวณ filteredSchools โดยไม่ต้องใช้ useEffect
  const filteredSchools = useMemo(() => {
    let result = baseSchools;
    
    if (regionFilter !== "all") {
      result = result.filter(school => school.region === regionFilter);
    }
    
    if (yearFilter !== "all") {
      result = result.filter(school => school.year === yearFilter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(school => 
        school.name.toLowerCase().includes(term) ||
        school.province.toLowerCase().includes(term) ||
        school.region.toLowerCase().includes(term) ||
        school.major.toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [baseSchools, regionFilter, yearFilter, searchTerm]);

  // ตั้งค่า loading state แรกเมื่อ component mount
  useEffect(() => {
    // จำลองการโหลดข้อมูล
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const getRegionColor = (regionName: string): string => {
    const region = THAI_REGIONS.find(r => r.name === regionName);
    return region?.color || '#6b7280';
  };

  const groupByRegion = (schools: SchoolData[]) => {
    return schools.reduce((acc, school) => {
      if (!acc[school.region]) {
        acc[school.region] = [];
      }
      acc[school.region].push(school);
      return acc;
    }, {} as Record<string, SchoolData[]>);
  };

  const groupByMajor = (schools: SchoolData[]) => {
    return schools.reduce((acc, school) => {
      if (!acc[school.major]) {
        acc[school.major] = [];
      }
      acc[school.major].push(school);
      return acc;
    }, {} as Record<string, SchoolData[]>);
  };

  const regionGroups = groupByRegion(filteredSchools);
  const majorGroups = groupByMajor(filteredSchools);
  const totalApplicants = filteredSchools.reduce((sum, school) => sum + school.applicants, 0);
  const totalSchools = filteredSchools.length;
  
  const uniqueRegions = Array.from(new Set(baseSchools.map(s => s.region))).sort();
  const uniqueYears = Array.from(new Set(baseSchools.map(s => s.year))).sort((a, b) => b.localeCompare(a));

  const topSchools = [...filteredSchools]
    .sort((a, b) => b.applicants - a.applicants)
    .slice(0, 5);

  const topRegions = Object.entries(regionGroups)
    .map(([region, schools]) => ({
      region,
      total: schools.reduce((sum, s) => sum + s.applicants, 0),
      count: schools.length,
      avg: schools.length > 0 ? Math.round(schools.reduce((sum, s) => sum + s.applicants, 0) / schools.length) : 0
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  const topMajors = major !== "all" 
    ? [{ 
        major, 
        total: totalApplicants, 
        count: totalSchools, 
        avg: totalSchools > 0 ? Math.round(totalApplicants / totalSchools) : 0 
      }]
    : Object.entries(majorGroups)
        .map(([major, schools]) => ({
          major,
          total: schools.reduce((sum, s) => sum + s.applicants, 0),
          count: schools.length,
          avg: schools.length > 0 ? Math.round(schools.reduce((sum, s) => sum + s.applicants, 0) / schools.length) : 0
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 3);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">ข้อมูลโรงเรียน</h2>
            <p className="text-sm text-muted-foreground">
              กำลังโหลดข้อมูลโรงเรียน...
            </p>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center border rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูลโรงเรียน...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            {major === "all" ? "ข้อมูลโรงเรียนทุกสาขา" : `ข้อมูลโรงเรียน: ${major}`}
          </h2>
          <p className="text-sm text-muted-foreground">
            ปีการศึกษา: {years.join(", ")} | 
            โรงเรียน: {totalSchools} แห่ง | ผู้สมัคร: {totalApplicants} คน
            {major !== "all" && ` | สาขา: ${major}`}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "stats" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("stats")}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            สถิติ
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="flex items-center gap-2"
          >
            <School className="h-4 w-4" />
            รายชื่อ
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            ตัวกรองข้อมูลโรงเรียน
          </CardTitle>
          <CardDescription>
            {major === "all" 
              ? "กรองโรงเรียนตามภูมิภาค, ปีการศึกษา, หรือชื่อโรงเรียน (เลือกทุกสาขา)" 
              : `กรองโรงเรียนสำหรับสาขา: ${major}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">ภูมิภาค</label>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกภูมิภาค" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกภูมิภาค</SelectItem>
                  {uniqueRegions.map(region => (
                    <SelectItem key={region} value={region}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: getRegionColor(region) }}
                        />
                        {region}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">ปีการศึกษา</label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกปีการศึกษา" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกปีการศึกษา</SelectItem>
                  {uniqueYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">ค้นหา</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาโรงเรียนหรือจังหวัด..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
          
          {(regionFilter !== "all" || yearFilter !== "all" || searchTerm) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {regionFilter !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: getRegionColor(regionFilter) }}
                  />
                  ภูมิภาค: {regionFilter}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                    onClick={() => setRegionFilter("all")}
                  >
                    ×
                  </Button>
                </Badge>
              )}
              
              {yearFilter !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  ปี: {yearFilter}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                    onClick={() => setYearFilter("all")}
                  >
                    ×
                  </Button>
                </Badge>
              )}
              
              {searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  ค้นหา: {searchTerm}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                    onClick={() => setSearchTerm("")}
                  >
                    ×
                  </Button>
                </Badge>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRegionFilter("all");
                  setYearFilter("all");
                  setSearchTerm("");
                }}
                className="text-xs h-8"
              >
                ล้างตัวกรองทั้งหมด
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 mb-1">
                  {major === "all" ? "สาขายอดนิยม" : "สาขาที่เลือก"}
                </p>
                <p className="text-xl font-bold text-blue-800 truncate">
                  {topMajors.length > 0 
                    ? (major === "all" 
                      ? topMajors[0].major.split("วิชาเอก")[1] || topMajors[0].major
                      : major.split("วิชาเอก")[1] || major)
                    : "-"}
                </p>
                <p className="text-sm text-blue-700">
                  {topMajors.length > 0 ? `${topMajors[0].total} ผู้สมัคร` : ""}
                </p>
              </div>
              <Users className="h-10 w-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 mb-1">ภูมิภาคยอดนิยม</p>
                <p className="text-2xl font-bold text-green-800">
                  {topRegions.length > 0 ? topRegions[0].region : "-"}
                </p>
                <p className="text-sm text-green-700">
                  {topRegions.length > 0 ? `${topRegions[0].total} ผู้สมัคร` : ""}
                </p>
              </div>
              <MapPin className="h-10 w-10 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 mb-1">โรงเรียนยอดนิยม</p>
                <p className="text-xl font-bold text-purple-800 truncate">
                  {topSchools.length > 0 ? topSchools[0].name : "-"}
                </p>
                <p className="text-sm text-purple-700">
                  {topSchools.length > 0 ? `${topSchools[0].applicants} ผู้สมัคร` : ""}
                </p>
              </div>
              <School className="h-10 w-10 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {viewMode === "stats" ? (
        <div className="space-y-6">
          {major === "all" && topMajors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">สาขายอดนิยม</CardTitle>
                <CardDescription>สาขาวิชาที่มีผู้สมัครมากที่สุด</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topMajors.map((item, index) => (
                    <div key={item.major} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                          <span className="text-xs text-muted-foreground">อันดับ</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold truncate">{item.major}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>โรงเรียน: {item.count} แห่ง</span>
                            <span>เฉลี่ย: {item.avg} คน/โรงเรียน</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{item.total}</div>
                        <div className="text-sm text-muted-foreground">ผู้สมัครทั้งหมด</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {topRegions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ภูมิภาคยอดนิยม</CardTitle>
                <CardDescription>ภูมิภาคที่มีผู้สมัครมากที่สุด</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topRegions.map((item, index) => (
                    <div key={item.region} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: getRegionColor(item.region) }}
                          />
                          <h4 className="font-semibold">{item.region}</h4>
                          <Badge variant="outline">อันดับ #{index + 1}</Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">{item.total}</div>
                          <div className="text-sm text-muted-foreground">ผู้สมัคร</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>จำนวนโรงเรียน</span>
                          <span>{item.count} โรงเรียน</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>เฉลี่ยผู้สมัครต่อโรงเรียน</span>
                          <span>{item.avg} คน/โรงเรียน</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">โรงเรียนเด่น: </span>
                          {[...(regionGroups[item.region] || [])]
                            .sort((a, b) => b.applicants - a.applicants)
                            .slice(0, 3)
                            .map((school, idx) => (
                              <span key={school.id}>
                                {school.name}
                                {idx < 2 ? ', ' : ''}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {Object.keys(regionGroups).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ภาพรวมทุกภูมิภาค</CardTitle>
                <CardDescription>สถิติผู้สมัครแยกตามภูมิภาค</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(regionGroups).map(([region, regionSchools]) => {
                    const regionColor = getRegionColor(region);
                    const regionApplicants = regionSchools.reduce((sum, school) => sum + school.applicants, 0);
                    const regionSchoolCount = regionSchools.length;
                    const avgApplicants = regionSchoolCount > 0 ? Math.round(regionApplicants / regionSchoolCount) : 0;
                    
                    return (
                      <Card key={region} className="border-l-4" style={{ borderLeftColor: regionColor }}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: regionColor }}
                              />
                              <CardTitle className="text-base">{region}</CardTitle>
                            </div>
                            <Badge 
                              variant="outline"
                              style={{ backgroundColor: `${regionColor}20`, borderColor: regionColor }}
                            >
                              {regionSchoolCount} โรงเรียน
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="text-center p-2 bg-gray-50 rounded">
                                <div className="text-2xl font-bold" style={{ color: regionColor }}>
                                  {regionApplicants}
                                </div>
                                <div className="text-xs text-muted-foreground">ผู้สมัครทั้งหมด</div>
                              </div>
                              <div className="text-center p-2 bg-gray-50 rounded">
                                <div className="text-2xl font-bold" style={{ color: regionColor }}>
                                  {avgApplicants}
                                </div>
                                <div className="text-xs text-muted-foreground">เฉลี่ยต่อโรงเรียน</div>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="text-sm font-medium">โรงเรียนที่มีผู้สมัครสูงสุด</div>
                              {regionSchools
                                .sort((a, b) => b.applicants - a.applicants)
                                .slice(0, 2)
                                .map(school => (
                                  <div key={school.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                    <span className="truncate">{school.name}</span>
                                    <Badge variant="outline">{school.applicants} คน</Badge>
                                  </div>
                                ))}
                            </div>
                            
                            <div>
                              <div className="text-sm font-medium mb-1">จังหวัดที่มีผู้สมัคร</div>
                              <div className="flex flex-wrap gap-1">
                                {Array.from(new Set(regionSchools.map(s => s.province)))
                                  .slice(0, 4)
                                  .map(province => (
                                    <Badge 
                                      key={province} 
                                      variant="secondary" 
                                      className="text-xs"
                                      style={{ backgroundColor: `${regionColor}20` }}
                                    >
                                      {province}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>รายชื่อโรงเรียนทั้งหมด</CardTitle>
                <CardDescription>
                  แสดงโรงเรียนทั้งหมด {filteredSchools.length} แห่ง จาก {totalApplicants} ผู้สมัคร
                </CardDescription>
              </div>
              <div className="text-sm text-muted-foreground">
                เรียงตามจำนวนผู้สมัคร (มากไปน้อย)
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredSchools.length > 0 ? (
              <div className="space-y-4">
                {filteredSchools
                  .sort((a, b) => b.applicants - a.applicants)
                  .map((school) => {
                    const regionColor = getRegionColor(school.region);
                    
                    return (
                      <div 
                        key={school.id} 
                        className="p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-full flex-shrink-0" 
                                style={{ backgroundColor: regionColor }}
                              />
                              <h3 className="font-semibold text-lg">{school.name}</h3>
                              <Badge variant="outline" className="ml-2">
                                {school.year}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span className="text-sm">
                                  <span className="font-medium">{school.province}</span>
                                  <span className="mx-1">•</span>
                                  <span>{school.region}</span>
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Building className="h-4 w-4" />
                                <span className="text-sm font-medium">{school.major}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span className="text-sm">
                                  <span className="font-medium">{school.applicants}</span> ผู้สมัคร
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end">
                            <div className="text-3xl font-bold text-primary">
                              {school.applicants}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              จำนวนผู้สมัคร
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <div className="flex justify-between text-sm text-muted-foreground mb-1">
                            <span>สัดส่วนผู้สมัครเมื่อเทียบกับโรงเรียนอื่น</span>
                            <span className="font-medium">
                              อันดับ {filteredSchools
                                .slice()
                                .sort((a, b) => b.applicants - a.applicants)
                                .findIndex(s => s.id === school.id) + 1} 
                              / {filteredSchools.length}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="h-2.5 rounded-full transition-all duration-500" 
                              style={{ 
                                width: `${(school.applicants / Math.max(...filteredSchools.map(s => s.applicants)) * 100)}%`,
                                backgroundColor: regionColor
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-12">
                <School className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">ไม่พบข้อมูลโรงเรียน</h3>
                <p className="text-muted-foreground mb-4">
                  ไม่มีข้อมูลโรงเรียนที่ตรงกับเงื่อนไขการกรอง
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setRegionFilter("all");
                    setYearFilter("all");
                    setSearchTerm("");
                  }}
                >
                  ล้างตัวกรองทั้งหมด
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            สรุปภาพรวม
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="text-sm font-medium text-blue-600">สถิติผู้สมัคร</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">ผู้สมัครทั้งหมด</span>
                  <span className="font-bold">{totalApplicants} คน</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">โรงเรียนทั้งหมด</span>
                  <span className="font-bold">{totalSchools} โรงเรียน</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">เฉลี่ยผู้สมัครต่อโรงเรียน</span>
                  <span className="font-bold">
                    {totalSchools > 0 ? Math.round(totalApplicants / totalSchools) : 0} คน/โรงเรียน
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="text-sm font-medium text-blue-600">ภูมิภาคที่มีผู้สมัครมากที่สุด</div>
              {topRegions.length > 0 ? (
                <div className="space-y-2">
                  {topRegions.map((item, index) => (
                    <div key={item.region} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: getRegionColor(item.region) }}
                        />
                        <span>#{index + 1} {item.region}</span>
                      </div>
                      <span className="font-medium">{item.total} คน</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">ไม่มีข้อมูล</p>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="text-sm font-medium text-blue-600">โรงเรียนที่มีผู้สมัครมากที่สุด</div>
              {topSchools.length > 0 ? (
                <div className="space-y-2">
                  {topSchools.map((school, index) => (
                    <div key={school.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-600">#{index + 1}</span>
                        <span className="truncate">{school.name}</span>
                      </div>
                      <Badge variant="outline">{school.applicants} คน</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">ไม่มีข้อมูล</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}