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
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default function DashboardTCAS({ table, years, major = "all" }: DashboardTCASProps) {
  const [data, setData] = useState<TableRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#ec4899'];

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

  // Prepare data for charts
  const lineChartData = yearlySummaries.map(summary => ({
    year: summary.year,
    applicants: summary.applicants,
    qualified: summary.qualified,
    registered: summary.registered,
  }));

  // Top 10 majors by applicants
  const topMajors = [...data]
    .sort((a, b) => toNumber(b.applicants) - toNumber(a.applicants))
    .slice(0, 10)
    .map(row => ({
      name: getMajorName(row),
      applicants: toNumber(row.applicants),
      year: row.year,
      fill: COLORS[years.indexOf(row.year || '') % COLORS.length],
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
          registered: toNumber(yearData?.registered),
          registrationRate: calculatePercentage(yearData?.registered, yearData?.applicants),
        };
      }).filter(item => item.applicants > 0)
    : [];

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
            <CardTitle className="text-sm">DATA ENTRIES</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {major !== "all" ? "Single Major" : "All Majors"} across {years.length} year{years.length > 1 ? 's' : ''}
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
            <TabsTrigger value="major-trend">Major Trend</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Yearly Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Yearly Trend Comparison</CardTitle>
              <CardDescription>เปรียบเทียบแนวโน้มรายปี</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="applicants" stroke="#3b82f6" name="Applicants" />
                  <Line type="monotone" dataKey="qualified" stroke="#10b981" name="Qualified" />
                  <Line type="monotone" dataKey="registered" stroke="#8b5cf6" name="Registered" />
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
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Legend />
                  <Bar dataKey="applicants" name="Applicants" fill="#3b82f6">
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
              <CardDescription>วิเคราะห์ประสิทธิภาพของแต่ละสาขา</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid />
                    <XAxis type="number" dataKey="applicants" name="Applicants" />
                    <YAxis type="number" dataKey="registered" name="Registered" />
                    <ZAxis type="number" dataKey="year" range={[100, 1000]} />
                    <Tooltip 
                      formatter={(value, name) => [formatNumber(value), name]}
                      labelFormatter={(label) => `Year: ${label}`}
                    />
                    <Legend />
                    <Scatter name="Majors" data={data.map(d => ({
                      applicants: toNumber(d.applicants),
                      registered: toNumber(d.registered),
                      year: d.year,
                      name: getMajorName(d),
                    }))} fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {major !== "all" && years.length > 1 && (
          <TabsContent value="major-trend" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Major Trend Analysis: {major}</CardTitle>
                <CardDescription>ติดตามแนวโน้มของสาขา {major} ตามปี</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={majorPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === "registrationRate") {
                            return [`${value}%`, "Registration Rate"];
                          }
                          return [formatNumber(value), name];
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="applicants" stroke="#3b82f6" name="Applicants" />
                      <Line type="monotone" dataKey="registered" stroke="#8b5cf6" name="Registered" />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="registrationRate" 
                        stroke="#10b981" 
                        name="Registration Rate %" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}