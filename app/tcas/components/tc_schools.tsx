// app/tcas/components/tc_schools.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { School, MapPin, Users, Building, Filter, Search } from "lucide-react";
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
  year: string; // พ.ศ. เช่น 2565, 2566
  major: string;
}

interface SchoolsTCASProps {
  table: string;
  years: string[]; // พ.ศ.
  major?: string;
}

// Data for Thai regions with colors
const THAI_REGIONS = [
  { id: 1, name: "ภาคเหนือ", color: "#3b82f6", provinces: ["เชียงใหม่", "เชียงราย", "ลำพูน", "ลำปาง", "พะเยา", "น่าน", "แพร่", "แม่ฮ่องสอน", "อุตรดิตถ์"] },
  { id: 2, name: "ภาคตะวันออกเฉียงเหนือ", color: "#10b981", provinces: ["ขอนแก่น", "อุดรธานี", "นครราชสีมา", "อุบลราชธานี", "สกลนคร", "ร้อยเอ็ด", "มหาสารคาม", "เลย", "บุรีรัมย์", "สุรินทร์", "ศรีสะเกษ", "หนองคาย", "หนองบัวลำภู", "มุกดาหาร", "ยโสธร", "อำนาจเจริญ", "บึงกาฬ"] },
  { id: 3, name: "ภาคกลาง", color: "#8b5cf6", provinces: ["กรุงเทพมหานคร", "นนทบุรี", "ปทุมธานี", "สมุทรปราการ", "สมุทรสาคร", "สมุทรสงคราม", "นครปฐม", "สุพรรณบุรี", "พระนครศรีอยุธยา", "ลพบุรี", "สระบุรี", "ชัยนาท", "สิงห์บุรี", "อ่างทอง", "นครนายก", "กาญจนบุรี", "ราชบุรี", "เพชรบุรี", "ประจวบคีรีขันธ์"] },
  { id: 4, name: "ภาคตะวันออก", color: "#f59e0b", provinces: ["ชลบุรี", "ระยอง", "จันทบุรี", "ตราด", "ฉะเชิงเทรา", "ปราจีนบุรี", "สระแก้ว"] },
  { id: 5, name: "ภาคตะวันตก", color: "#ef4444", provinces: ["กาญจนบุรี", "ราชบุรี", "เพชรบุรี", "ประจวบคีรีขันธ์"] },
  { id: 6, name: "ภาคใต้", color: "#06b6d4", provinces: ["นครศรีธรรมราช", "สุราษฎร์ธานี", "สงขลา", "พัทลุง", "ตรัง", "กระบี่", "ภูเก็ต", "ระนอง", "พังงา", "สตูล", "ยะลา", "ปัตตานี", "นราธิวาส"] },
];

// Mock school data - ใช้ปีพ.ศ. ตามที่ต้องการ
const MOCK_SCHOOLS: SchoolData[] = [
  // 2565
  { id: 1, name: "โรงเรียนสวนกุหลาบวิทยาลัย", region: "ภาคกลาง", province: "กรุงเทพมหานคร", applicants: 45, year: "2565", major: "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร" },
  { id: 2, name: "โรงเรียนเตรียมอุดมศึกษา", region: "ภาคกลาง", province: "กรุงเทพมหานคร", applicants: 38, year: "2565", major: "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร" },
  { id: 3, name: "โรงเรียนมหิดลวิทยานุสรณ์", region: "ภาคกลาง", province: "นครปฐม", applicants: 32, year: "2565", major: "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร" },
  { id: 4, name: "โรงเรียนเบญจมราชูทิศ", region: "ภาคเหนือ", province: "เชียงใหม่", applicants: 28, year: "2565", major: "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร" },
  { id: 5, name: "โรงเรียนสตรีวิทยา ๒", region: "ภาคกลาง", province: "กรุงเทพมหานคร", applicants: 25, year: "2565", major: "วิชาเอกการออกแบบสื่อปฏิสัมพันธ์และมัลติมีเดีย" },
  { id: 6, name: "โรงเรียนสิรินธร", region: "ภาคตะวันออกเฉียงเหนือ", province: "สุรินทร์", applicants: 22, year: "2565", major: "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร" },
  { id: 7, name: "โรงเรียนสตรีนนทบุรี", region: "ภาคกลาง", province: "นนทบุรี", applicants: 20, year: "2565", major: "วิชาเอกการออกแบบสื่อปฏิสัมพันธ์และมัลติมีเดีย" },
  { id: 8, name: "โรงเรียนสุรศักดิ์มนตรี", region: "ภาคกลาง", province: "กรุงเทพมหานคร", applicants: 18, year: "2565", major: "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร" },
  { id: 9, name: "โรงเรียนหาดใหญ่วิทยาลัย", region: "ภาคใต้", province: "สงขลา", applicants: 15, year: "2565", major: "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร" },
  { id: 10, name: "โรงเรียนสตรีภูเก็ต", region: "ภาคใต้", province: "ภูเก็ต", applicants: 12, year: "2565", major: "วิชาเอกการออกแบบสื่อปฏิสัมพันธ์และมัลติมีเดีย" },
  
  // 2566
  { id: 11, name: "โรงเรียนอุดรพิทยานุกูล", region: "ภาคตะวันออกเฉียงเหนือ", province: "อุดรธานี", applicants: 30, year: "2566", major: "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร" },
  { id: 12, name: "โรงเรียนขอนแก่นวิทยายน", region: "ภาคตะวันออกเฉียงเหนือ", province: "ขอนแก่น", applicants: 27, year: "2566", major: "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร" },
  { id: 13, name: "โรงเรียนชลกันยานุกูล", region: "ภาคตะวันออก", province: "ชลบุรี", applicants: 24, year: "2566", major: "วิชาเอกการออกแบบสื่อปฏิสัมพันธ์และมัลติมีเดีย" },
  { id: 14, name: "โรงเรียนปทุมเทพวิทยาคาร", region: "ภาคตะวันออกเฉียงเหนือ", province: "หนองคาย", applicants: 21, year: "2566", major: "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร" },
  { id: 15, name: "โรงเรียนเลยพิทยาคม", region: "ภาคตะวันออกเฉียงเหนือ", province: "เลย", applicants: 19, year: "2566", major: "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร" },
  
  // 2565 - สาขาอื่น
  { id: 16, name: "โรงเรียนสามเสนวิทยาลัย", region: "ภาคกลาง", province: "กรุงเทพมหานคร", applicants: 35, year: "2565", major: "วิชาเอกการจัดการภาพยนตร์และสื่อดิจิทัล" },
  { id: 17, name: "โรงเรียนสตรีมหาพฤฒาราม", region: "ภาคกลาง", province: "กรุงเทพมหานคร", applicants: 30, year: "2565", major: "วิชาเอกการผลิตภาพยนตร์และสื่อดิจิทัล" },
  { id: 18, name: "โรงเรียนเทพศิรินทร์", region: "ภาคกลาง", province: "กรุงเทพมหานคร", applicants: 28, year: "2565", major: "วิชาเอกการสื่อสารเพื่อการจัดการนวัตกรรม" },
  { id: 19, name: "โรงเรียนศึกษานารี", region: "ภาคกลาง", province: "กรุงเทพมหานคร", applicants: 25, year: "2565", major: "วิชาเอกการสื่อสารเพื่อการท่องเที่ยว" },
  { id: 20, name: "โรงเรียนนวมินทราชูทิศ", region: "ภาคกลาง", province: "กรุงเทพมหานคร", applicants: 22, year: "2565", major: "วิชาเอกการสื่อสารเพื่อสุขภาพ" },
];

export default function SchoolsTCAS({ table, years, major = "all" }: SchoolsTCASProps) {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    console.log("Years received in SchoolsTCAS:", years); // Debug log
    console.log("Major received in SchoolsTCAS:", major); // Debug log
    
    // Simulate API call
    setLoading(true);
    
    setTimeout(() => {
      let filtered = MOCK_SCHOOLS;
      
      console.log("Initial mock data count:", filtered.length); // Debug log
      
      // Filter by selected years
      if (years.length > 0) {
        filtered = filtered.filter(school => years.includes(school.year));
        console.log("After year filter:", filtered.length); // Debug log
      }
      
      // Filter by major if not "all"
      if (major !== "all") {
        filtered = filtered.filter(school => school.major === major);
        console.log("After major filter:", filtered.length); // Debug log
      }
      
      console.log("Filtered data:", filtered); // Debug log
      
      setSchools(filtered);
      setFilteredSchools(filtered);
      setLoading(false);
    }, 500);
  }, [table, years, major]);

  useEffect(() => {
    let result = schools;
    
    // Apply region filter
    if (regionFilter !== "all") {
      result = result.filter(school => school.region === regionFilter);
    }
    
    // Apply year filter
    if (yearFilter !== "all") {
      result = result.filter(school => school.year === yearFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(school => 
        school.name.toLowerCase().includes(term) ||
        school.province.toLowerCase().includes(term) ||
        school.region.toLowerCase().includes(term)
      );
    }
    
    setFilteredSchools(result);
  }, [schools, regionFilter, yearFilter, searchTerm]);

  // Get region color
  const getRegionColor = (regionName: string): string => {
    const region = THAI_REGIONS.find(r => r.name === regionName);
    return region?.color || '#6b7280';
  };

  // Group schools by region for statistics
  const groupByRegion = (schools: SchoolData[]) => {
    return schools.reduce((acc, school) => {
      if (!acc[school.region]) {
        acc[school.region] = [];
      }
      acc[school.region].push(school);
      return acc;
    }, {} as Record<string, SchoolData[]>);
  };

  // Calculate statistics
  const regionGroups = groupByRegion(filteredSchools);
  const totalApplicants = filteredSchools.reduce((sum, school) => sum + school.applicants, 0);
  const totalSchools = filteredSchools.length;
  
  // Get unique regions and years for filters
  const uniqueRegions = Array.from(new Set(schools.map(s => s.region))).sort();
  const uniqueYears = Array.from(new Set(schools.map(s => s.year))).sort((a, b) => b.localeCompare(a));

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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">ข้อมูลโรงเรียน</h2>
          <p className="text-sm text-muted-foreground">
            ปีการศึกษา: {years.join(", ")} | สาขา: {major === "all" ? "ทุกสาขา" : major}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Building className="h-3 w-3" />
            {totalSchools} โรงเรียน
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {totalApplicants} ผู้สมัคร
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ตัวกรอง</CardTitle>
          <CardDescription>กรองโรงเรียนตามภูมิภาค, ปีการศึกษา, หรือชื่อโรงเรียน</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาโรงเรียน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Region Filter */}
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="กรองตามภูมิภาค" />
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
            
            {/* Year Filter */}
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="กรองตามปีการศึกษา" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกปีการศึกษา</SelectItem>
                {uniqueYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Active Filters */}
          {(regionFilter !== "all" || yearFilter !== "all" || searchTerm) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {regionFilter !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  ภูมิภาค: {regionFilter}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
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
                    className="h-4 w-4 p-0 ml-1"
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
                    className="h-4 w-4 p-0 ml-1"
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
                className="text-xs"
              >
                ล้างตัวกรองทั้งหมด
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Region Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(regionGroups).map(([region, regionSchools]) => {
          const regionColor = getRegionColor(region);
          const regionApplicants = regionSchools.reduce((sum, school) => sum + school.applicants, 0);
          const regionSchoolCount = regionSchools.length;
          
          return (
            <Card key={region} className="border-l-4" style={{ borderLeftColor: regionColor }}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{region}</CardTitle>
                  <Badge 
                    variant="outline"
                    style={{ backgroundColor: `${regionColor}20`, borderColor: regionColor }}
                  >
                    {regionSchoolCount} โรงเรียน
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">ผู้สมัครทั้งหมด</span>
                    <span className="font-bold">{regionApplicants}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">เฉลี่ยต่อโรงเรียน</span>
                    <span className="font-medium">
                      {Math.round(regionApplicants / regionSchoolCount)}
                    </span>
                  </div>
                  <div className="pt-2">
                    <div className="text-xs text-muted-foreground mb-1">จังหวัดที่มีผู้สมัคร</div>
                    <div className="flex flex-wrap gap-1">
                      {Array.from(new Set(regionSchools.map(s => s.province)))
                        .slice(0, 3)
                        .map(province => (
                          <Badge key={province} variant="secondary" className="text-xs">
                            {province}
                          </Badge>
                        ))}
                      {Array.from(new Set(regionSchools.map(s => s.province))).length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{Array.from(new Set(regionSchools.map(s => s.province))).length - 3} จังหวัด
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Schools List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>รายชื่อโรงเรียน</CardTitle>
              <CardDescription>
                แสดงโรงเรียนทั้งหมด {filteredSchools.length} แห่ง จาก {totalApplicants} ผู้สมัคร
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              เรียงตามจำนวนผู้สมัคร
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
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: regionColor }}
                            />
                            <h3 className="font-semibold">{school.name}</h3>
                            <Badge variant="outline" className="ml-2">
                              {school.year}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{school.province}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Building className="h-4 w-4" />
                              <span>{school.region}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>สาขา: {school.major}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-2xl font-bold text-primary">
                            {school.applicants}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            จำนวนผู้สมัคร
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress bar for visualization */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>สัดส่วนผู้สมัคร</span>
                          <span>
                            {(school.applicants / Math.max(...filteredSchools.map(s => s.applicants)) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full" 
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
              <School className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">ไม่พบข้อมูลโรงเรียน</h3>
              <p className="text-muted-foreground">
                ไม่มีข้อมูลโรงเรียนที่ตรงกับเงื่อนไขการกรอง
                <br />
                <span className="text-sm">ปีการศึกษา: {years.join(", ")} | สาขา: {major}</span>
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
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

      {/* Summary */}
      {filteredSchools.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">สรุปข้อมูลโรงเรียน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="text-sm text-blue-600">โรงเรียนที่มีผู้สมัครมากที่สุด</div>
                <div className="font-bold text-lg">
                  {filteredSchools.length > 0 
                    ? filteredSchools.sort((a, b) => b.applicants - a.applicants)[0].name
                    : "-"
                  }
                </div>
                <div className="text-sm text-blue-700">
                  {filteredSchools.length > 0 
                    ? `${filteredSchools.sort((a, b) => b.applicants - a.applicants)[0].applicants} ผู้สมัคร`
                    : ""
                  }
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-blue-600">ภูมิภาคที่มีผู้สมัครมากที่สุด</div>
                <div className="font-bold text-lg">
                  {Object.entries(regionGroups).length > 0
                    ? Object.entries(regionGroups)
                        .map(([region, schools]) => ({
                          region,
                          total: schools.reduce((sum, s) => sum + s.applicants, 0)
                        }))
                        .sort((a, b) => b.total - a.total)[0].region
                    : "-"
                  }
                </div>
                <div className="text-sm text-blue-700">
                  {Object.entries(regionGroups).length > 0
                    ? `${Object.entries(regionGroups)
                        .map(([region, schools]) => ({
                          region,
                          total: schools.reduce((sum, s) => sum + s.applicants, 0)
                        }))
                        .sort((a, b) => b.total - a.total)[0].total} ผู้สมัคร`
                    : ""
                  }
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-blue-600">ค่าเฉลี่ยผู้สมัครต่อโรงเรียน</div>
                <div className="font-bold text-lg">
                  {filteredSchools.length > 0
                    ? Math.round(totalApplicants / filteredSchools.length)
                    : 0
                  }
                </div>
                <div className="text-sm text-blue-700">
                  จากทั้งหมด {filteredSchools.length} โรงเรียน
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}