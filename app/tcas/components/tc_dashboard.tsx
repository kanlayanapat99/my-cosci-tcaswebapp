// components/tc_dashboard.tsx
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
  PieChart,
  Pie,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Type สำหรับข้อมูลจาก API ของตาราง - ปรับตามโครงสร้างข้อมูลจริง
interface TableRowData {
  id?: number;
  major?: string;           // ชื่อเอก/สาขา
  department_name?: string; // อาจใช้ชื่อนี้ในบางตาราง
  department?: string;      // หรืออาจใช้ชื่อนี้
  applicants: number | string | null;
  qualified: number | string | null;
  registered: number | string | null;
  year?: string;
  faculty?: string;
  [key: string]: string | number | null | undefined; // สำหรับ field อื่นๆ ที่อาจมี
}

interface DashboardTCASProps {
  table: string;
  year: string;
}

// Type สำหรับ Custom Tooltip
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey?: string;
    payload?: Record<string, unknown>;
  }>;
  label?: string;
}

// Helper function ที่ทำงานกับทุกค่าได้
const toNumber = (value: unknown): number => {
  // ถ้าเป็น null หรือ undefined ให้เป็น 0
  if (value === null || value === undefined) return 0;
  
  // ถ้าเป็น string ให้แปลงเป็น number
  if (typeof value === 'string') {
    // ลองแปลงเป็น number ถ้าสามารถแปลงได้
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
  
  // ถ้าเป็น number แต่เป็น NaN หรือ Infinity
  if (typeof value === 'number') {
    return isNaN(value) || !isFinite(value) ? 0 : value;
  }
  
  // ถ้าเป็น boolean หรือ type อื่น
  try {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  } catch {
    return 0;
  }
};

// Helper function สำหรับ format ตัวเลข
const formatNumber = (value: unknown): string => {
  const num = toNumber(value);
  return num.toLocaleString();
};

// Helper function สำหรับคำนวณเปอร์เซ็นต์
const calculatePercentage = (part: unknown, total: unknown): number => {
  const partNum = toNumber(part);
  const totalNum = toNumber(total);
  
  if (totalNum === 0) return 0;
  return Math.round((partNum / totalNum) * 100);
};

// Helper function สำหรับดึงชื่อเอก/สาขา
const getMajorName = (row: TableRowData): string => {
  // ลองดึงชื่อจาก field ต่างๆ ตามลำดับความสำคัญ
  return row.major || row.department_name || row.department || `เอก ${row.id || ''}` || "ไม่มีชื่อ";
};

export default function DashboardTCAS({ table, year }: DashboardTCASProps) {
  const [data, setData] = useState<TableRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // สีสำหรับกราฟ
  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#ec4899', '#14b8a6'];

  useEffect(() => {
    if (!table || !year) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // ดึงข้อมูลจาก API เดียวกับตาราง
        const response = await fetch(`/api/tcas/${table}?year=${year}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json() as TableRowData[];
        
        if (!Array.isArray(result)) {
          throw new Error('Invalid data format received from API');
        }

        // รับข้อมูลมาเลย ไม่ต้องแปลงอะไร
        setData(result);
        
        // Debug: ดูโครงสร้างข้อมูลที่ได้รับ
        console.log('Dashboard data received:', result.slice(0, 1)); // แสดงแค่ record แรกเพื่อดูโครงสร้าง
        
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [table, year]);

  // คำนวณข้อมูลสรุปจากแถวข้อมูลทั้งหมด - ใช้ toNumber เพื่อให้ปลอดภัย
  const totalApplicants = data.reduce((sum, row) => sum + toNumber(row.applicants), 0);
  const totalQualified = data.reduce((sum, row) => sum + toNumber(row.qualified), 0);
  const totalRegistered = data.reduce((sum, row) => sum + toNumber(row.registered), 0);
  
  const summaryData = {
    applicants: totalApplicants,
    qualified: totalQualified,
    registered: totalRegistered,
    registrationRate: calculatePercentage(totalRegistered, totalApplicants),
    qualificationRate: calculatePercentage(totalQualified, totalApplicants)
  };

  // เตรียมข้อมูลสำหรับกราฟต่างๆ
  const lineChartData = data.map(row => ({
    name: getMajorName(row),
    registered: toNumber(row.registered),
    applicants: toNumber(row.applicants),
    qualified: toNumber(row.qualified)
  })).slice(0, 11);

  const barChartData = data.map((row, index) => ({
    name: getMajorName(row),
    applicants: toNumber(row.applicants),
    fill: COLORS[index % COLORS.length]
  })).slice(0, 11);

  // สรุปข้อมูลสำหรับ Pie Chart
  const pieChartData = [
    { name: "ผู้สมัคร", value: summaryData.applicants, color: "#3b82f6" },
    { name: "ผ่านการคัดเลือก", value: summaryData.qualified, color: "#10b981" },
    { name: "รายงานตัว", value: summaryData.registered, color: "#8b5cf6" },
  ];

  // ฟังก์ชัน Export เป็น PDF
  const handleExportPDF = async () => {
  const element = document.getElementById(`dashboard-${table}-${year}`);
  if (!element) return;

  try {
    alert('กำลังสร้าง PDF... กรุณารอสักครู่');
    
    // 1. แก้ไขฟังก์ชันสี CSS ที่ไม่รองรับก่อน capture
    type StyleProperty = 
      | 'backgroundColor'
      | 'color'
      | 'borderColor'
      | 'borderTopColor'
      | 'borderRightColor'
      | 'borderBottomColor'
      | 'borderLeftColor'
      | 'outlineColor'
      | 'textDecorationColor'
      | 'columnRuleColor';
    
    interface StyleKey {
      el: Element;
      prop: StyleProperty;
    }
    
    const originalStyles = new Map<StyleKey, string>();
    
    // หาองค์ประกอบทั้งหมดที่มีฟังก์ชันสี lab, lch, oklab, oklch
    const allElements = element.querySelectorAll('*');
    
    allElements.forEach((el: Element) => {
      const style = window.getComputedStyle(el);
      
      // ตรวจสอบคุณสมบัติสีทั้งหมด
      const colorProperties: StyleProperty[] = [
        'backgroundColor',
        'color',
        'borderColor',
        'borderTopColor',
        'borderRightColor',
        'borderBottomColor',
        'borderLeftColor',
        'outlineColor',
        'textDecorationColor',
        'columnRuleColor'
      ];
      
      colorProperties.forEach(prop => {
        const value = style.getPropertyValue(prop);
        if (value && (value.includes('lab(') || value.includes('lch(') || 
            value.includes('oklab(') || value.includes('oklch('))) {
          
          // บันทึกค่าเดิม
          const htmlEl = el as HTMLElement;
          const styleValue = htmlEl.style.getPropertyValue(prop);
          originalStyles.set({el, prop}, styleValue);
          
          // แทนที่ด้วยสี hex ที่ปลอดภัย
          let safeColor = '#ffffff'; // default white
          
          if (value.includes('lab(') || value.includes('oklab(')) {
            // ถ้าเป็นสี light ให้ใช้สีเทาอ่อน
            safeColor = '#f3f4f6';
          } else if (value.includes('lch(') || value.includes('oklch(')) {
            // ถ้าเป็นสีเข้มให้ใช้สีเทาเข้ม
            safeColor = '#6b7280';
          }
          
          htmlEl.style.setProperty(prop, safeColor, 'important');
        }
      });
    });
    
    // 2. ตั้งค่า element สำหรับ capture
    interface OriginalElementStyles {
      height: string;
      overflow: string;
      position: string;
      width: string;
      left: string;
      top: string;
    }
    
    const originalElementStyles: OriginalElementStyles = {
      height: element.style.height,
      overflow: element.style.overflow,
      position: element.style.position,
      width: element.style.width,
      left: element.style.left,
      top: element.style.top
    };
    
    element.style.height = 'auto';
    element.style.overflow = 'visible';
    element.style.position = 'absolute';
    element.style.width = '100%';
    element.style.left = '0';
    element.style.top = '0';
    
    // 3. รอให้การเปลี่ยนแปลง layout เสร็จสิ้น
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 4. ใช้ html2canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      allowTaint: true,
      removeContainer: true,
      foreignObjectRendering: false,
      imageTimeout: 15000,
      width: element.scrollWidth,
      height: element.scrollHeight,
      onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {
        // ป้องกันฟังก์ชันสีที่ไม่รองรับใน cloned element
        const allClonedElements = clonedElement.querySelectorAll('*');
        allClonedElements.forEach((el: Element) => {
          const htmlEl = el as HTMLElement;
          // ลบ inline styles ที่อาจมีฟังก์ชันสีที่ไม่รองรับ
          htmlEl.removeAttribute('style');
          
          // เพิ่มสไตล์พื้นฐาน
          htmlEl.style.backgroundColor = 'white';
          htmlEl.style.color = 'black';
        });
      }
    });
    
    // 5. คืนค่าสไตล์เดิม
    Object.assign(element.style, originalElementStyles);
    
    // คืนค่าฟังก์ชันสีเดิม
    originalStyles.forEach((value: string, key: StyleKey) => {
      if (key.el && key.prop && value !== undefined) {
        const htmlEl = key.el as HTMLElement;
        htmlEl.style.setProperty(key.prop, value);
      }
    });
    
    // 6. สร้าง PDF (แก้ไขส่วนนี้)
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgWidth = 210; // ความกว้าง A4
    const pageHeight = 297; // ความสูง A4
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;
    
    // เพิ่มหน้าแรก
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // เพิ่มหน้าต่อไปถ้าจำเป็น
    while (heightLeft >= 0) {
      position -= pageHeight; // ย้ายตำแหน่งขึ้นสำหรับหน้าใหม่
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // บันทึกไฟล์
    pdf.save(`dashboard-${table}-${year}.pdf`);
    alert('สร้าง PDF สำเร็จแล้ว!');
    
  } catch (err: unknown) {
    console.error('Error exporting PDF:', err);
    alert('เกิดข้อผิดพลาดในการสร้าง PDF: ' + (err as Error).message);
  }
};

  // Custom Tooltip สำหรับกราฟ
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="mt-8 space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 p-8 text-center border rounded-lg bg-red-50">
        <p className="text-red-600">เกิดข้อผิดพลาด: {error}</p>
        <p className="text-sm text-gray-500 mt-2">โปรดตรวจสอบการเชื่อมต่อหรือลองใหม่</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="mt-8 p-8 text-center border rounded-lg bg-gray-50">
        <p className="text-gray-500">ไม่มีข้อมูลสำหรับ {table} ปีการศึกษา {year}</p>
      </div>
    );
  }

  return (
    <div id={`dashboard-${table}-${year}`} className="mt-8 space-y-6">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Dashboard {table.toUpperCase().replace('_', ' ')}</h2>
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleExportPDF} 
            variant="outline" 
            size="sm"
            className="gap-2 hover:bg-blue-300"
          >
            <Download className="h-4 w-4" />
            Expand dashboard as PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">TOTAL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summaryData.applicants)}</div>
            <p className="text-sm text-muted-foreground mt-1">จำนวนผู้สมัครทั้งหมด</p>
          </CardContent>
        </Card>

        {/* Summary Card 2 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Summary card</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">จำนวนผู้ผ่านการคัดเลือก</span>
                <span className="font-medium">{formatNumber(summaryData.qualified)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">จำนวนผู้รายงานตัว</span>
                <span className="font-medium">{formatNumber(summaryData.registered)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Card 3 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Summary card</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">อัตราผ่านการคัดเลือก</span>
                <span className="font-medium text-green-600">{summaryData.qualificationRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">อัตราการรายงานตัว</span>
                <span className="font-medium text-purple-600">{summaryData.registrationRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Card 4 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Summary card</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {summaryData.qualified > 0 
                  ? `${Math.round((summaryData.registered / summaryData.qualified) * 100)}%`
                  : "0%"}
              </div>
              <p className="text-sm text-muted-foreground">อัตรารายงานตัวจากผู้ผ่านการคัดเลือก</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Line Chart</CardTitle>
            <CardDescription>เปรียบเทียบ ผู้ผ่านการคัดเลือกและผู้รายงานตัว</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                  tick={{ fontSize: 10 }}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="registered" 
                  name="ผู้รายงานตัว"
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="qualified" 
                  name="ผู้ผ่านการคัดเลือก"
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bar Chart</CardTitle>
            <CardDescription>เปรียบเทียบจำนวนผู้สมัครแต่ละเอก</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                  tick={{ fontSize: 10 }}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="applicants" 
                  name="จำนวนผู้สมัคร"
                  radius={[4, 4, 0, 0]}
                >
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Stats Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">สรุปสถิติสำคัญ</CardTitle>
          <CardDescription>ข้อมูลเปรียบเทียบและวิเคราะห์เพิ่มเติม</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-500 mb-1">สาขาที่มีผู้สมัครสูงสุด</div>
              <div className="text-lg font-semibold truncate">
                {data.length > 0 
                  ? getMajorName(data.reduce((max, current) => 
                      toNumber(current.applicants) > toNumber(max.applicants) ? current : max
                    ))
                  : "-"
                }
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {data.length > 0 
                  ? `${Math.max(...data.map(d => toNumber(d.applicants))).toLocaleString()} คน`
                  : ""
                }
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-500 mb-1">ค่าเฉลี่ยผู้สมัครต่อสาขา</div>
              <div className="text-lg font-semibold">
                {data.length > 0 
                  ? Math.round(summaryData.applicants / data.length).toLocaleString()
                  : "0"
                }
              </div>
              <div className="text-sm text-gray-600 mt-1">
                จากทั้งหมด {data.length} สาขา
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-500 mb-1">สาขาที่มีผู้ผ่านการคัดเลือกสูงสุด</div>
              <div className="text-lg font-semibold truncate">
                {data.length > 0 
                  ? getMajorName(data.reduce((max, current) => 
                      toNumber(current.qualified) > toNumber(max.qualified) ? current : max
                    ))
                  : "-"
                }
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {data.length > 0 
                  ? `${Math.max(...data.map(d => toNumber(d.qualified))).toLocaleString()} คน`
                  : ""
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">สรุปภาพรวมทั้งหมด</CardTitle>
            <CardDescription>อัตราส่วนผู้สมัคร/ผ่านการคัดเลือก/รายงานตัว</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: { name: string, percent: number }) => 
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatNumber(value)}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">ตารางสรุปข้อมูลโดยละเอียด</CardTitle>
            <CardDescription>แสดงข้อมูลครบถ้วนทุกสาขา</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">ลำดับ</th>
                    <th className="text-left py-3 px-2 font-medium">ชื่อเอก/สาขา</th>
                    <th className="text-left py-3 px-2 font-medium text-blue-600">ผู้สมัคร</th>
                    <th className="text-left py-3 px-2 font-medium text-green-600">ผ่านการคัดเลือก</th>
                    <th className="text-left py-3 px-2 font-medium text-purple-600">รายงานตัว</th>
                    <th className="text-left py-3 px-2 font-medium">อัตราการรายงานตัว</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, index) => {
                    const applicants = toNumber(row.applicants);
                    const qualified = toNumber(row.qualified);
                    const registered = toNumber(row.registered);
                    const registrationRate = calculatePercentage(registered, applicants);
                    const qualificationRate = calculatePercentage(qualified, applicants);
                    const majorName = getMajorName(row);
                    
                    return (
                      <tr key={row.id || index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2 text-center">{index + 1}</td>
                        <td className="py-3 px-2 font-medium">{majorName}</td>
                        <td className="py-3 px-2 text-blue-600">{formatNumber(applicants)}</td>
                        <td className="py-3 px-2 text-green-600">
                          {formatNumber(qualified)}
                          <span className="text-xs text-gray-500 ml-1">({qualificationRate}%)</span>
                        </td>
                        <td className="py-3 px-2 text-purple-600">
                          {formatNumber(registered)}
                          <span className="text-xs text-gray-500 ml-1">({registrationRate}%)</span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full" 
                              style={{ width: `${registrationRate}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{registrationRate}%</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}