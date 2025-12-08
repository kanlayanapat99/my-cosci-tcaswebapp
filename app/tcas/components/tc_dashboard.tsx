"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  TooltipProps
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { School, MapPin, Users, Building } from "lucide-react";

interface TableRowData {
  id?: number;
  major?: string;
  year?: string;
  applicants: number | string | null;
  qualified: number | string | null;
  registered: number | string | null;
  quota?: number | string | null;
  confirmed?: number | string | null;
  interview_eligible?: number | string | null;
  interview_attended?: number | string | null;
  [key: string]: string | number | null | undefined;
}

interface DashboardTCASProps {
  table: string;
  years: string[];
  major?: string;
}

interface YearlySummary {
  year: string;
  applicants: number;
  qualified: number;
  registered: number;
  quota?: number;
  confirmed?: number;
}

// Type for scatter chart data
interface ScatterData {
  major: string;
  applicants: number;
  registered: number;
  year: string;
  color: string;
}

// Type for school data (ตัวอย่างโครงสร้าง)
interface SchoolData {
  id: number;
  name: string;
  region: string;
  province: string;
  applicants: number;
  year: string;
}

// Type for tooltip payload
interface TooltipPayload {
  payload: ScatterData;
}

// Data for Thai regions
const THAI_REGIONS = [
  { id: 1, name: "ภาคเหนือ", color: "#3b82f6", provinces: ["เชียงใหม่", "เชียงราย", "ลำพูน", "ลำปาง", "พะเยา", "น่าน", "แพร่", "แม่ฮ่องสอน", "อุตรดิตถ์"] },
  { id: 2, name: "ภาคตะวันออกเฉียงเหนือ", color: "#10b981", provinces: ["ขอนแก่น", "อุดรธานี", "นครราชสีมา", "อุบลราชธานี", "สกลนคร", "ร้อยเอ็ด", "มหาสารคาม", "เลย", "บุรีรัมย์", "สุรินทร์", "ศรีสะเกษ", "หนองคาย", "หนองบัวลำภู", "มุกดาหาร", "ยโสธร", "อำนาจเจริญ", "บึงกาฬ"] },
  { id: 3, name: "ภาคกลาง", color: "#8b5cf6", provinces: ["กรุงเทพมหานคร", "นนทบุรี", "ปทุมธานี", "สมุทรปราการ", "สมุทรสาคร", "สมุทรสงคราม", "นครปฐม", "สุพรรณบุรี", "พระนครศรีอยุธยา", "ลพบุรี", "สระบุรี", "ชัยนาท", "สิงห์บุรี", "อ่างทอง", "นครนายก", "กาญจนบุรี", "ราชบุรี", "เพชรบุรี", "ประจวบคีรีขันธ์"] },
  { id: 4, name: "ภาคตะวันออก", color: "#f59e0b", provinces: ["ชลบุรี", "ระยอง", "จันทบุรี", "ตราด", "ฉะเชิงเทรา", "ปราจีนบุรี", "สระแก้ว"] },
  { id: 5, name: "ภาคตะวันตก", color: "#ef4444", provinces: ["กาญจนบุรี", "ราชบุรี", "เพชรบุรี", "ประจวบคีรีขันธ์"] },
  { id: 6, name: "ภาคใต้", color: "#06b6d4", provinces: ["นครศรีธรรมราช", "สุราษฎร์ธานี", "สงขลา", "พัทลุง", "ตรัง", "กระบี่", "ภูเก็ต", "ระนอง", "พังงา", "สตูล", "ยะลา", "ปัตตานี", "นราธิวาส"] },
];

// Mock school data (ตัวอย่างข้อมูลโรงเรียน)
const MOCK_SCHOOLS: SchoolData[] = [
  { id: 1, name: "โรงเรียนสวนกุหลาบวิทยาลัย", region: "ภาคกลาง", province: "กรุงเทพมหานคร", applicants: 45, year: "2565" },
  { id: 2, name: "โรงเรียนเตรียมอุดมศึกษา", region: "ภาคกลาง", province: "กรุงเทพมหานคร", applicants: 38, year: "2565" },
  { id: 3, name: "โรงเรียนมหิดลวิทยานุสรณ์", region: "ภาคกลาง", province: "นครปฐม", applicants: 32, year: "2565" },
  { id: 4, name: "โรงเรียนเบญจมราชูทิศ", region: "ภาคเหนือ", province: "เชียงใหม่", applicants: 28, year: "2565" },
  { id: 5, name: "โรงเรียนสตรีวิทยา ๒", region: "ภาคกลาง", province: "กรุงเทพมหานคร", applicants: 25, year: "2565" },
  { id: 6, name: "โรงเรียนสิรินธร", region: "ภาคตะวันออกเฉียงเหนือ", province: "สุรินทร์", applicants: 22, year: "2565" },
  { id: 7, name: "โรงเรียนสตรีนนทบุรี", region: "ภาคกลาง", province: "นนทบุรี", applicants: 20, year: "2565" },
  { id: 8, name: "โรงเรียนสุรศักดิ์มนตรี", region: "ภาคกลาง", province: "กรุงเทพมหานคร", applicants: 18, year: "2565" },
  { id: 9, name: "โรงเรียนหาดใหญ่วิทยาลัย", region: "ภาคใต้", province: "สงขลา", applicants: 15, year: "2565" },
  { id: 10, name: "โรงเรียนสตรีภูเก็ต", region: "ภาคใต้", province: "ภูเก็ต", applicants: 12, year: "2565" },
  { id: 11, name: "โรงเรียนอุดรพิทยานุกูล", region: "ภาคตะวันออกเฉียงเหนือ", province: "อุดรธานี", applicants: 30, year: "2566" },
  { id: 12, name: "โรงเรียนขอนแก่นวิทยายน", region: "ภาคตะวันออกเฉียงเหนือ", province: "ขอนแก่น", applicants: 27, year: "2566" },
  { id: 13, name: "โรงเรียนชลกันยานุกูล", region: "ภาคตะวันออก", province: "ชลบุรี", applicants: 24, year: "2566" },
  { id: 14, name: "โรงเรียนปทุมเทพวิทยาคาร", region: "ภาคตะวันออกเฉียงเหนือ", province: "หนองคาย", applicants: 21, year: "2566" },
  { id: 15, name: "โรงเรียนเลยพิทยาคม", region: "ภาคตะวันออกเฉียงเหนือ", province: "เลย", applicants: 19, year: "2566" },
];

const toNumber = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
  if (typeof value === 'number') {
    return isNaN(value) || !isFinite(value) ? 0 : value;
  }
  try {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  } catch {
    return 0;
  }
};

const formatNumber = (value: unknown): string => {
  const num = toNumber(value);
  return num.toLocaleString();
};

const calculatePercentage = (part: unknown, total: unknown): number => {
  const partNum = toNumber(part);
  const totalNum = toNumber(total);
  if (totalNum === 0) return 0;
  return Math.round((partNum / totalNum) * 100);
};

const getMajorName = (row: TableRowData): string => {
  return row.major || `เอก ${row.id || ''}` || "ไม่มีชื่อ";
};

// Function to generate color from major name
const getColorFromMajor = (major: string): string => {
  let hash = 0;
  for (let i = 0; i < major.length; i++) {
    hash = major.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 70%, 60%)`;
};

// Color palette for different majors
const MAJOR_COLORS = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', 
  '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#ec4899',
  '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#ec4899'
];

// Function to get region color
const getRegionColor = (regionName: string): string => {
  const region = THAI_REGIONS.find(r => r.name === regionName);
  return region?.color || '#6b7280';
};

// Function to filter schools by major and year (mock function)
const getSchoolsByMajorAndYear = (major: string, years: string[]): SchoolData[] => {
  // ในสภาพจริงจะเป็นการเรียก API หรือ query จากฐานข้อมูล
  // ตอนนี้เราจะใช้ mock data และ filter ตามปี
  return MOCK_SCHOOLS.filter(school => 
    years.includes(school.year) && 
    school.applicants > 0
  ).map(school => ({
    ...school,
    // เพิ่มข้อมูล major (ใน mock data ยังไม่มี field นี้)
    // ในสภาพจริงข้อมูลโรงเรียนจะเชื่อมโยงกับสาขา
  }));
};

// Function to group schools by region
const groupSchoolsByRegion = (schools: SchoolData[]) => {
  return schools.reduce((acc, school) => {
    if (!acc[school.region]) {
      acc[school.region] = [];
    }
    acc[school.region].push(school);
    return acc;
  }, {} as Record<string, SchoolData[]>);
};

// Function to get region statistics
const getRegionStatistics = (schools: SchoolData[]) => {
  const grouped = groupSchoolsByRegion(schools);
  
  return Object.entries(grouped).map(([region, regionSchools]) => {
    const totalApplicants = regionSchools.reduce((sum, school) => sum + school.applicants, 0);
    const provinces = Array.from(new Set(regionSchools.map(s => s.province)));
    
    return {
      region,
      color: getRegionColor(region),
      totalApplicants,
      schoolCount: regionSchools.length,
      provinceCount: provinces.length,
      provinces,
      schools: regionSchools.slice(0, 5), // แสดงเพียง 5 โรงเรียนแรก
    };
  }).sort((a, b) => b.totalApplicants - a.totalApplicants); // เรียงตามจำนวนผู้สมัคร
};

// Custom tooltip for scatter chart with proper types
interface CustomScatterTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

const CustomScatterTooltip: React.FC<CustomScatterTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;
  return (
    <div className="bg-white p-4 border rounded shadow-lg">
      <p className="font-bold">{data.major}</p>
      <p className="text-sm">ปี: {data.year}</p>
      <p className="text-sm">จำนวนผู้สมัคร: {formatNumber(data.applicants)}</p>
      <p className="text-sm">จำนวนรายงานตัว: {formatNumber(data.registered)}</p>
      <p className="text-sm">
        อัตรารายงานตัว: {calculatePercentage(data.registered, data.applicants)}%
      </p>
    </div>
  );
};

export default function DashboardTCAS({ table, years, major = "all" }: DashboardTCASProps) {
  const [data, setData] = useState<TableRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [schoolData, setSchoolData] = useState<SchoolData[]>([]);

  useEffect(() => {
    if (!table || years.length === 0) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const yearsParam = years.join(',');
        const url = `/api/tcas/${table}?years=${yearsParam}${major !== "all" ? `&major=${major}` : ''}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json() as TableRowData[];
        
        if (!Array.isArray(result)) {
          throw new Error('Invalid data format received from API');
        }

        setData(result);
        
        // ในสภาพจริง: เรียก API เพื่อดึงข้อมูลโรงเรียนตาม major และ years
        // ตอนนี้เราจะใช้ mock data
        if (major !== "all") {
          const mockSchools = getSchoolsByMajorAndYear(major, years);
          setSchoolData(mockSchools);
        }
        
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [table, years, major]);

  // Calculate overall totals
  const totalApplicants = data.reduce((sum, row) => sum + toNumber(row.applicants), 0);
  const totalQualified = data.reduce((sum, row) => sum + toNumber(row.qualified), 0);
  const totalRegistered = data.reduce((sum, row) => sum + toNumber(row.registered), 0);
  const totalQuota = data.reduce((sum, row) => sum + toNumber(row.quota), 0);
  
  // Calculate yearly summaries
  const yearlySummaries = years.map(year => {
    const yearData = data.filter(row => row.year === year);
    return {
      year,
      applicants: yearData.reduce((sum, row) => sum + toNumber(row.applicants), 0),
      qualified: yearData.reduce((sum, row) => sum + toNumber(row.qualified), 0),
      registered: yearData.reduce((sum, row) => sum + toNumber(row.registered), 0),
      quota: yearData.reduce((sum, row) => sum + toNumber(row.quota), 0),
    };
  });

  // Prepare data for charts - Only applicants for line chart
  const lineChartData = yearlySummaries.map(summary => ({
    year: summary.year,
    applicants: summary.applicants,
  }));

  // Top 10 majors by applicants
  const topMajors = [...data]
    .sort((a, b) => toNumber(b.applicants) - toNumber(a.applicants))
    .slice(0, 10)
    .map(row => ({
      name: getMajorName(row),
      applicants: toNumber(row.applicants),
      year: row.year,
      fill: MAJOR_COLORS[Math.floor(Math.random() * MAJOR_COLORS.length)],
    }));

  // Year comparison data
  const yearComparisonData = years.map(year => {
    const yearData = data.filter(row => row.year === year);
    const applicants = yearData.reduce((sum, row) => sum + toNumber(row.applicants), 0);
    const registered = yearData.reduce((sum, row) => sum + toNumber(row.registered), 0);
    return {
      year,
      applicants,
      registered,
      registrationRate: calculatePercentage(registered, applicants),
    };
  });

  // Major performance across years (if multiple years and specific major)
  const majorPerformanceData = major !== "all" && years.length > 1 
    ? years.map(year => {
        const yearData = data.find(row => row.year === year && row.major === major);
        return {
          year,
          applicants: toNumber(yearData?.applicants),
          qualified: toNumber(yearData?.qualified),
          registered: toNumber(yearData?.registered),
          registrationRate: calculatePercentage(yearData?.registered, yearData?.applicants),
          qualificationRate: calculatePercentage(yearData?.qualified, yearData?.applicants),
        };
      }).filter(item => item.applicants > 0)
    : [];

  // Prepare scatter chart data with different colors for each major
  const getScatterData = (): ScatterData[] => {
    const uniqueMajors = Array.from(new Set(data.map(row => row.major || '').filter(Boolean)));
    
    return data.map((row, index) => {
      const majorName = getMajorName(row);
      const majorIndex = uniqueMajors.indexOf(majorName);
      const color = majorIndex >= 0 
        ? MAJOR_COLORS[majorIndex % MAJOR_COLORS.length] 
        : `hsl(${(index * 50) % 360}, 70%, 60%)`;
      
      return {
        major: majorName,
        applicants: toNumber(row.applicants),
        registered: toNumber(row.registered),
        year: row.year || '',
        color,
      };
    });
  };

  const scatterData = getScatterData();

  // Get region statistics for schools
  const regionStatistics = getRegionStatistics(schoolData);

  // Custom legend for scatter chart
  const renderScatterLegend = () => {
    const uniqueMajors = Array.from(new Set(scatterData.map(item => item.major)));
    
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {uniqueMajors.slice(0, 10).map((major, index) => {
          const color = scatterData.find(item => item.major === major)?.color || MAJOR_COLORS[index % MAJOR_COLORS.length];
          return (
            <div key={major} className="flex items-center gap-1 text-xs">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span className="truncate max-w-[100px]">{major}</span>
            </div>
          );
        })}
        {uniqueMajors.length > 10 && (
          <div className="text-xs text-gray-500">
            + {uniqueMajors.length - 10} สาขาอื่นๆ
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="mt-8 space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 p-8 text-center border rounded-lg bg-red-50">
        <p className="text-red-600">เกิดข้อผิดพลาด: {error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="mt-8 p-8 text-center border rounded-lg bg-gray-50">
        <p className="text-gray-500">ไม่มีข้อมูลสำหรับ {table} ปีการศึกษา {years.join(', ')} {major !== 'all' ? `สาขา ${major}` : ''}</p>
      </div>
    );
  }

  return (
    <div id={`dashboard-${table}`} className="mt-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          Dashboard {table.toUpperCase().replace('_', ' ')}
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({years.length} ปี{years.length > 1 ? 's' : ''}: {years.join(', ')} | Major: {major === "all" ? "All" : major})
          </span>
        </h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">TOTAL APPLICANTS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalApplicants)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {years.length > 1 ? `เฉลี่ย ${formatNumber(totalApplicants / years.length)} ต่อปี` : 'จำนวนผู้สมัครทั้งหมด'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">TOTAL REGISTERED</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalRegistered)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Registration Rate: {calculatePercentage(totalRegistered, totalApplicants)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">TOTAL QUOTA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalQuota)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Fill Rate: {calculatePercentage(totalRegistered, totalQuota)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">TOTAL QUALIFIED</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalQualified)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Qualification Rate: {calculatePercentage(totalQualified, totalApplicants)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="yearly">Year Comparison</TabsTrigger>
          <TabsTrigger value="majors">Top Majors</TabsTrigger>
          {major !== "all" && years.length > 1 && (
            <TabsTrigger value="major-trend">Major Trend & Schools</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Yearly Trend Chart - Only Applicants */}
          <Card>
            <CardHeader>
              <CardTitle>Yearly Trend Comparison</CardTitle>
              <CardDescription>จำนวนผู้สมัครตามปี</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatNumber(value), "จำนวนผู้สมัคร"]} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="applicants" 
                    stroke="#3b82f6" 
                    name="จำนวนผู้สมัคร"
                    strokeWidth={3}
                    activeDot={{ r: 8 }}
                    dot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Majors Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Majors by Applicants</CardTitle>
              <CardDescription>สาขายอดนิยมตามจำนวนผู้สมัคร</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topMajors}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatNumber(value), "จำนวนผู้สมัคร"]} />
                  <Legend />
                  <Bar dataKey="applicants" name="จำนวนผู้สมัคร">
                    {topMajors.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yearly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Year-by-Year Comparison</CardTitle>
              <CardDescription>เปรียบเทียบประสิทธิภาพแต่ละปี</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Registration Rate Comparison */}
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="applicants" name="Applicants" fill="#3b82f6" />
                      <Bar yAxisId="left" dataKey="registered" name="Registered" fill="#8b5cf6" />
                      <Line yAxisId="right" type="monotone" dataKey="registrationRate" name="Registration Rate %" stroke="#10b981" strokeWidth={2} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Yearly Summary Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Year</th>
                        <th className="text-left py-2 px-4">Applicants</th>
                        <th className="text-left py-2 px-4">Registered</th>
                        <th className="text-left py-2 px-4">Registration Rate</th>
                        <th className="text-left py-2 px-4">Quota Fill Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearlySummaries.map((summary) => (
                        <tr key={summary.year} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4 font-medium">{summary.year}</td>
                          <td className="py-2 px-4">{formatNumber(summary.applicants)}</td>
                          <td className="py-2 px-4">{formatNumber(summary.registered)}</td>
                          <td className="py-2 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full" 
                                  style={{ width: `${calculatePercentage(summary.registered, summary.applicants)}%` }}
                                />
                              </div>
                              <span>{calculatePercentage(summary.registered, summary.applicants)}%</span>
                            </div>
                          </td>
                          <td className="py-2 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${calculatePercentage(summary.registered, summary.quota)}%` }}
                                />
                              </div>
                              <span>{calculatePercentage(summary.registered, summary.quota)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="majors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Major Performance Analysis</CardTitle>
              <CardDescription>วิเคราะห์ประสิทธิภาพของแต่ละสาขา - แสดงความชุกของผู้สมัครและรายงานตัว</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid />
                    <XAxis 
                      type="number" 
                      dataKey="applicants" 
                      name="Applicants"
                      label={{ value: 'จำนวนผู้สมัคร', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="registered" 
                      name="Registered"
                      label={{ value: 'จำนวนรายงานตัว', angle: -90, position: 'insideLeft' }}
                    />
                    <ZAxis type="number" dataKey="year" range={[100, 1000]} />
                    <Tooltip content={<CustomScatterTooltip />} />
                    <Legend />
                    {Array.from(new Set(scatterData.map(item => item.major))).slice(0, 10).map((majorName, index) => {
                      const majorData = scatterData.filter(item => item.major === majorName);
                      const color = majorData[0]?.color || MAJOR_COLORS[index % MAJOR_COLORS.length];
                      
                      return (
                        <Scatter
                          key={majorName}
                          name={majorName}
                          data={majorData}
                          fill={color}
                          shape="circle"
                          opacity={0.8}
                        />
                      );
                    })}
                  </ScatterChart>
                </ResponsiveContainer>
                <div className="mt-4">
                  {renderScatterLegend()}
                </div>
              </div>
              
              {/* Additional Analysis */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">ความหนาแน่นสูง</h4>
                  <p className="text-sm text-blue-600">
                    จุดที่อยู่ด้านบนขวาแสดงถึงสาขาที่มีจำนวนผู้สมัครและผู้รายงานตัวสูง (สาขายอดนิยม)
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">ประสิทธิภาพสูง</h4>
                  <p className="text-sm text-green-600">
                    จุดที่อยู่เหนือเส้น diagonal แสดงถึงสาขาที่มีอัตรารายงานตัวสูงเมื่อเทียบกับจำนวนผู้สมัคร
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {major !== "all" && years.length > 1 && (
          <TabsContent value="major-trend" className="space-y-6">
            {/* Major Trend Chart - Without Registered Line */}
            <Card>
              <CardHeader>
                <CardTitle>Major Trend Analysis: {major}</CardTitle>
                <CardDescription>
                  ติดตามแนวโน้มของสาขา {major} ตามปี
                  <span className="block text-sm text-muted-foreground mt-1">
                    แสดงจำนวนผู้สมัครและอัตราการผ่านการคัดเลือก
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={majorPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === "registrationRate") {
                            return [`${value}%`, "Registration Rate"];
                          }
                          if (name === "qualificationRate") {
                            return [`${value}%`, "Qualification Rate"];
                          }
                          return [formatNumber(value), name];
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="applicants" 
                        stroke="#3b82f6" 
                        name="จำนวนผู้สมัคร" 
                        strokeWidth={3}
                        dot={{ r: 5 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="qualified" 
                        stroke="#10b981" 
                        name="จำนวนผู้ผ่านการคัดเลือก" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="qualificationRate" 
                        stroke="#f59e0b" 
                        name="Qualification Rate %" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Summary Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <h4 className="font-medium">แนวโน้มผู้สมัคร</h4>
                    </div>
                    {majorPerformanceData.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm">
                          ปีล่าสุด: {formatNumber(majorPerformanceData[majorPerformanceData.length - 1].applicants)} คน
                        </p>
                        <p className="text-sm">
                          ปีแรก: {formatNumber(majorPerformanceData[0].applicants)} คน
                        </p>
                        <p className={`text-sm font-medium ${
                          majorPerformanceData[majorPerformanceData.length - 1].applicants > majorPerformanceData[0].applicants 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          การเปลี่ยนแปลง: {(
                            ((majorPerformanceData[majorPerformanceData.length - 1].applicants - majorPerformanceData[0].applicants) / 
                            majorPerformanceData[0].applicants) * 100
                          ).toFixed(1)}%
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="h-5 w-5 text-green-600" />
                      <h4 className="font-medium">อัตราการคัดเลือก</h4>
                    </div>
                    {majorPerformanceData.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm">
                          เฉลี่ย: {(
                            majorPerformanceData.reduce((sum, item) => sum + item.qualificationRate, 0) / 
                            majorPerformanceData.length
                          ).toFixed(1)}%
                        </p>
                        <p className="text-sm">
                          สูงสุด: {Math.max(...majorPerformanceData.map(item => item.qualificationRate))}%
                        </p>
                        <p className="text-sm">
                          ต่ำสุด: {Math.min(...majorPerformanceData.map(item => item.qualificationRate))}%
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-5 w-5 text-purple-600" />
                      <h4 className="font-medium">ข้อมูลโรงเรียน</h4>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm">
                        จำนวนโรงเรียนในตัวอย่าง: {schoolData.length} โรงเรียน
                      </p>
                      <p className="text-sm">
                        จำนวนภูมิภาค: {regionStatistics.length} ภูมิภาค
                      </p>
                      <p className="text-sm">
                        โรงเรียนทั้งหมด: {schoolData.length} แห่ง
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* School Information by Region */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center gap-2">
                    <School className="h-5 w-5" />
                    โรงเรียนที่สมัครในสาขา {major}
                  </div>
                </CardTitle>
                <CardDescription>
                  ข้อมูลโรงเรียนที่นักเรียนมาจากภูมิภาคต่างๆ ในประเทศไทย
                  {schoolData.length === 0 && (
                    <span className="block text-amber-600 mt-1">
                      หมายเหตุ: ขณะนี้ยังไม่มีข้อมูลโรงเรียนจริง กำลังแสดงข้อมูลตัวอย่างเพื่อการออกแบบ
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {regionStatistics.length > 0 ? (
                  <div className="space-y-6">
                    {/* Region Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {regionStatistics.map((region) => (
                        <div 
                          key={region.region}
                          className="p-4 rounded-lg border"
                          style={{ borderLeftColor: region.color, borderLeftWidth: '4px' }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: region.color }}
                            />
                            <h4 className="font-medium text-sm">{region.region}</h4>
                          </div>
                          <div className="space-y-1">
                            <p className="text-2xl font-bold">{region.totalApplicants}</p>
                            <p className="text-xs text-muted-foreground">ผู้สมัคร</p>
                            <div className="flex justify-between text-xs">
                              <span>{region.schoolCount} โรงเรียน</span>
                              <span>{region.provinceCount} จังหวัด</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Detailed Region Information */}
                    {regionStatistics.map((region) => (
                      <div key={region.region} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: region.color }}
                            />
                            <h3 className="font-semibold text-lg">{region.region}</h3>
                            <Badge variant="outline">
                              {region.totalApplicants} ผู้สมัคร
                            </Badge>
                            <Badge variant="secondary">
                              {region.schoolCount} โรงเรียน
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {region.provinceCount} จังหวัด
                          </div>
                        </div>

                        {/* Top Schools in Region */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {region.schools.map((school) => (
                            <div key={school.id} className="p-4 border rounded-lg hover:bg-gray-50">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium">{school.name}</h4>
                                <Badge variant="outline">{school.applicants} คน</Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <MapPin className="h-4 w-4" />
                                <span>{school.province}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  ปี {school.year}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Province Distribution */}
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">กระจายตามจังหวัด</h4>
                          <div className="flex flex-wrap gap-2">
                            {region.provinces.map((province) => {
                              const provinceSchools = region.schools.filter(s => s.province === province);
                              const provinceApplicants = provinceSchools.reduce((sum, s) => sum + s.applicants, 0);
                              
                              return (
                                <Badge 
                                  key={province}
                                  variant="outline"
                                  className="flex items-center gap-1"
                                >
                                  {province}
                                  <span className="text-xs font-semibold">({provinceApplicants})</span>
                                </Badge>
                              );
                            })}
                          </div>
                        </div>

                        {regionStatistics.indexOf(region) < regionStatistics.length - 1 && (
                          <Separator className="my-6" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <School className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">ยังไม่มีข้อมูลโรงเรียน</h3>
                    <p className="text-muted-foreground">
                      ข้อมูลโรงเรียนที่นักเรียนมาจากภูมิภาคต่างๆ กำลังอยู่ในระหว่างการพัฒนา
                    </p>
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">ข้อมูลตัวอย่างที่วางแผนจะแสดง</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• โรงเรียนที่นักเรียนสมัครมาจากแต่ละภูมิภาค</li>
                        <li>• จำนวนผู้สมัครจากแต่ละโรงเรียน</li>
                        <li>• การกระจายตัวตามจังหวัดและภูมิภาค</li>
                        <li>• แนวโน้มของโรงเรียนที่ส่งนักเรียนเข้ามา</li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}