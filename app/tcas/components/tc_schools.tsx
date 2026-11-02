// app/tcas/components/tc_schools.tsx
"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/customized/select/select";
import { Search, School, Trophy, Users, X, Info } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { SCHOOL_RECORDS, MAJOR_RANKINGS, TCAS_ROUNDS, DATA_LABEL, type SchoolRecord } from "@/lib/schools";

type Props = {
  /** ถ้าระบุ จะล็อกให้แสดงเฉพาะรอบนั้น (ใช้ในหน้า /tcas/[table]) */
  table?: string;
  title?: string;
};

type Ranked = { name: string; applicants: number; rank: number };

// รวมยอดตามชื่อโรงเรียน แล้วเรียงมาก→น้อย (คะแนนเท่ากันได้อันดับเดียวกัน)
function rankSchools(records: SchoolRecord[]): Ranked[] {
  const map = new Map<string, number>();
  records.forEach((r) => map.set(r.name, (map.get(r.name) || 0) + r.applicants));
  const sorted = [...map.entries()]
    .map(([name, applicants]) => ({ name, applicants }))
    .sort((a, b) => b.applicants - a.applicants || a.name.localeCompare(b.name, "th"));
  return sorted.map((s, i) => ({
    ...s,
    rank: i > 0 && sorted[i - 1].applicants === s.applicants ? 0 : i + 1,
  })).reduce<Ranked[]>((acc, s) => {
    acc.push({ ...s, rank: s.rank === 0 ? acc[acc.length - 1].rank : s.rank });
    return acc;
  }, []);
}

function RankRow({ item, max, color, tags }: { item: Ranked; max: number; color: string; tags?: string[] }) {
  const medal = item.rank <= 3;
  return (
    <div className="flex items-center gap-3 py-2">
      <div
        className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${
          medal ? "text-white" : "bg-gray-100 text-gray-600"
        }`}
        style={medal ? { backgroundColor: color } : undefined}
      >
        {item.rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-3 text-sm">
          <span className="font-medium truncate" title={item.name}>{item.name}</span>
          <span className="font-semibold whitespace-nowrap">{item.applicants.toLocaleString()} คน</span>
        </div>
        <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${(item.applicants / max) * 100}%`, backgroundColor: color, opacity: medal ? 1 : 0.55 }}
          />
        </div>
        {tags && tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {tags.map((t) => <Badge key={t} variant="secondary" className="text-[10px] font-normal">ติดอันดับสาขา{t}</Badge>)}
          </div>
        )}
      </div>
    </div>
  );
}

function RankList({ items, color, limit = 10, tagsOf }: { items: Ranked[]; color: string; limit?: number; tagsOf?: (name: string) => string[] }) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? items : items.slice(0, limit);
  const max = items[0]?.applicants || 1;
  return (
    <div>
      <div className="divide-y">
        {shown.map((it) => <RankRow key={it.name} item={it} max={max} color={color} tags={tagsOf?.(it.name)} />)}
      </div>
      {items.length > limit && (
        <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setShowAll(!showAll)}>
          {showAll ? "แสดงน้อยลง" : `ดูทั้งหมด ${items.length} โรงเรียน`}
        </Button>
      )}
    </div>
  );
}

export default function SchoolsTCAS({ table, title = "อันดับโรงเรียนที่สมัครมากที่สุด" }: Props) {
  const [round, setRound] = useState<string>(table || "all");
  const [view, setView] = useState<"overall" | "major">("overall");
  const [search, setSearch] = useState("");
  const [majorFilter, setMajorFilter] = useState("all");

  const activeRound = table || round;
  const color = TCAS_ROUNDS.find((r) => r.value === activeRound)?.color || "#3b82f6";

  const scoped = useMemo(
    () => SCHOOL_RECORDS.filter((r) => activeRound === "all" || r.tcas === activeRound),
    [activeRound]
  );

  const majorScoped = useMemo(
    () => MAJOR_RANKINGS.filter((m) => activeRound === "all" || m.tcas === activeRound),
    [activeRound]
  );
  const majors = useMemo(() => majorScoped.map((m) => m.major), [majorScoped]);
  const majorsBySchool = useMemo(() => {
    const map = new Map<string, string[]>();
    majorScoped.forEach((m) => m.schools.forEach((n) => map.set(n, [...(map.get(n) || []), m.major])));
    return map;
  }, [majorScoped]);

  const ranked = useMemo(() => rankSchools(scoped), [scoped]);
  const term = search.trim().toLowerCase();
  const searched = useMemo(
    () => (term ? ranked.filter((s) => s.name.toLowerCase().includes(term)) : ranked),
    [ranked, term]
  );

  const majorGroups = useMemo(
    () =>
      majorScoped
        .filter((m) => majorFilter === "all" || m.major === majorFilter)
        .map((m) => ({
          ...m,
          list: m.schools
            .map((name, i) => ({ name, order: i + 1 }))
            .filter((x) => !term || x.name.toLowerCase().includes(term)),
        }))
        .filter((g) => g.list.length > 0),
    [majorScoped, majorFilter, term]
  );

  const total = ranked.reduce((s, x) => s + x.applicants, 0);
  const chartData = ranked.slice(0, 10).map((s) => ({
    name: s.name.replace(/^โรงเรียน/, "").slice(0, 26),
    full: s.name,
    applicants: s.applicants,
    rank: s.rank,
  }));

  return (
    <div className="space-y-6">
      {/* หัวข้อ + ตัวเลือกมุมมอง */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <School className="h-6 w-6" style={{ color }} />
            {title}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {DATA_LABEL} · ค้นหาโรงเรียนและดูอันดับผู้สมัคร (หน่วย: คน)
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={view === "overall" ? "default" : "outline"} onClick={() => setView("overall")}>
            อันดับรวม
          </Button>
          <Button size="sm" variant={view === "major" ? "default" : "outline"} onClick={() => setView("major")}>
            แยกตามสาขา
          </Button>
        </div>
      </div>

      {/* ตัวกรอง: รอบ TCAS + ค้นหา */}
      <div className="flex flex-col md:flex-row gap-3">
        {!table && (
          <div className="flex flex-wrap gap-2">
            {[{ value: "all", label: "ทุกรอบ", color: "#111827" }, ...TCAS_ROUNDS].map((r) => {
              const count = SCHOOL_RECORDS.filter((x) => r.value === "all" || x.tcas === r.value).length;
              const active = round === r.value;
              return (
                <Button
                  key={r.value}
                  size="sm"
                  variant={active ? "default" : "outline"}
                  onClick={() => setRound(r.value)}
                  className="rounded-full"
                >
                  {r.label}
                  <span className={`ml-2 text-xs ${active ? "opacity-80" : "text-muted-foreground"}`}>{count}</span>
                </Button>
              );
            })}
          </div>
        )}
        <div className="relative md:ml-auto md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อโรงเรียน..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              aria-label="ล้างคำค้นหา"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {scoped.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center text-muted-foreground">
            <School className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            ยังไม่มีข้อมูลโรงเรียนของรอบนี้
          </CardContent>
        </Card>
      ) : (
        <>
          {/* สรุปตัวเลข */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-l-4" style={{ borderLeftColor: color }}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground flex items-center gap-2"><School className="h-4 w-4" />จำนวนโรงเรียน</p>
                <p className="text-2xl font-bold mt-1">{ranked.length} แห่ง</p>
              </CardContent>
            </Card>
            <Card className="border-l-4" style={{ borderLeftColor: color }}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" />ผู้สมัครรวม</p>
                <p className="text-2xl font-bold mt-1">{total.toLocaleString()} คน</p>
              </CardContent>
            </Card>
            <Card className="border-l-4" style={{ borderLeftColor: color }}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground flex items-center gap-2"><Trophy className="h-4 w-4" />อันดับ 1</p>
                <p className="text-base font-bold mt-1 truncate" title={ranked[0]?.name}>{ranked[0]?.name}</p>
                <p className="text-sm text-muted-foreground">{ranked[0]?.applicants.toLocaleString()} คน</p>
              </CardContent>
            </Card>
          </div>

          {view === "overall" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* กราฟ Top 10 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top 10 โรงเรียน</CardTitle>
                  <CardDescription>เรียงจากจำนวนผู้สมัครสูงสุด</CardDescription>
                </CardHeader>
                <CardContent style={{ height: Math.max(260, chartData.length * 38) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} interval={0} />
                      <Tooltip
                        formatter={(v) => [`${Number(v).toLocaleString()} คน`, "ผู้สมัคร"]}
                        labelFormatter={(_, p) => p?.[0]?.payload?.full ?? ""}
                      />
                      <Bar dataKey="applicants" radius={[0, 4, 4, 0]} maxBarSize={24}>
                        {chartData.map((d) => (
                          <Cell key={d.full} fill={color} fillOpacity={d.rank <= 3 ? 1 : 0.5} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* รายชื่อ + ค้นหา */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">รายชื่อโรงเรียนทั้งหมด</CardTitle>
                  <CardDescription>
                    {term ? `พบ ${searched.length} จาก ${ranked.length} โรงเรียน` : `${ranked.length} โรงเรียน เรียงตามจำนวนผู้สมัคร`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {searched.length > 0 ? (
                    <RankList items={searched} color={color} limit={searched.length > 10 && !term ? 10 : 100} tagsOf={(n) => majorsBySchool.get(n) || []} />
                  ) : (
                    <p className="py-10 text-center text-muted-foreground">ไม่พบโรงเรียนที่ตรงกับ “{search}”</p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                <Info className="h-5 w-5 shrink-0 mt-0.5" />
                <p>
                  {DATA_LABEL} — เอกสารระบุเฉพาะรายชื่อโรงเรียนที่มีผู้สมัครสูงสุดของแต่ละสาขา
                  (ไม่มีจำนวนผู้สมัครแยกสาขา) จึงแสดงเป็นรายชื่อเรียงตามลำดับในเอกสาร
                </p>
              </div>
              {majors.length > 1 && (
                <div className="w-full md:w-96">
                  <Select value={majorFilter} onValueChange={setMajorFilter}>
                    <SelectTrigger><SelectValue placeholder="เลือกสาขา" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทุกสาขา</SelectItem>
                      {majors.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {majorGroups.map((g) => (
                  <Card key={g.major}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-base">วิชาเอก{g.major}</CardTitle>
                        <Badge variant="outline" className="whitespace-nowrap">{g.list.length} โรงเรียน</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ol className="divide-y">
                        {g.list.map((x) => (
                          <li key={x.name} className="flex items-center gap-3 py-2 text-sm">
                            <span className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: color }}>{x.order}</span>
                            <span className="truncate" title={x.name}>{x.name}</span>
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                ))}
                {majorGroups.length === 0 && (
                  <p className="py-10 text-center text-muted-foreground lg:col-span-2">ไม่พบรายการ{search ? ` ที่ตรงกับ “${search}”` : ""}</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
