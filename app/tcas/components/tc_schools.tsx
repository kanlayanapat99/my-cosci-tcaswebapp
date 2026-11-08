// app/tcas/components/tc_schools.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/customized/select/select";
import { Search, School, Trophy, Users, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TCAS_ROUNDS, MAJOR_GROUPS, formatSource, type SchoolsPayload } from "@/lib/schools";

type Props = {
  /** ถ้าระบุ จะล็อกให้แสดงเฉพาะรอบนั้น (ใช้ในหน้า /tcas/[table]) */
  table?: string;
  title?: string;
};

type Ranked = { name: string; applicants: number; rank: number };

// รวมยอดตามชื่อโรงเรียน แล้วเรียงมาก→น้อย (คะแนนเท่ากันได้อันดับเดียวกัน)
function rankSchools(records: { name: string; applicants: number }[]): Ranked[] {
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
  const [data, setData] = useState<SchoolsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [round, setRound] = useState<string>(table || "all");
  const [view, setView] = useState<"overall" | "major">("overall");
  const [search, setSearch] = useState("");
  const [majorFilter, setMajorFilter] = useState("all");

  const [reloadKey, setReloadKey] = useState(0);

  // setState เรียกเฉพาะใน callback ของ fetch (ไม่เรียกตรงๆ ใน body ของ effect)
  useEffect(() => {
    let cancelled = false;
    fetch("/api/tcas/schools")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const retry = () => {
    setError(null);
    setReloadKey((k) => k + 1);
  };

  const activeRound = table || round;
  const roundNo = activeRound === "all" ? null : Number(activeRound.replace("tcas_", ""));
  const color = TCAS_ROUNDS.find((r) => r.value === activeRound)?.color || "#3b82f6";

  const sources = useMemo(() => (data?.sources ?? []).filter((x) => roundNo === null || x.round === roundNo), [data, roundNo]);
  const applicants = useMemo(() => (data?.applicants ?? []).filter((x) => roundNo === null || x.round === roundNo), [data, roundNo]);
  const ranks = useMemo(() => (data?.ranks ?? []).filter((x) => roundNo === null || x.round === roundNo), [data, roundNo]);
  const allMajors = useMemo(() => data?.majors ?? [], [data]);

  // label ใต้หัวข้อ — ตามรอบที่เลือก
  const label =
    sources.length > 0
      ? sources.map(formatSource).join(" · ")
      : roundNo
      ? `TCAS รอบ ${roundNo}`
      : "ทุกรอบ TCAS";

  const majorsBySchool = useMemo(() => {
    const names = new Map(allMajors.map((m) => [m.code, m.name.replace(/^วิชาเอก/, "")]));
    const map = new Map<string, string[]>();
    ranks.forEach((r) => {
      const n = names.get(r.major_code);
      if (!n) return;
      const cur = map.get(r.name) || [];
      if (!cur.includes(n)) map.set(r.name, [...cur, n]);
    });
    return map;
  }, [ranks, allMajors]);

  const ranked = useMemo(() => rankSchools(applicants), [applicants]);
  const term = search.trim().toLowerCase();
  const searched = useMemo(
    () => (term ? ranked.filter((x) => x.name.toLowerCase().includes(term)) : ranked),
    [ranked, term]
  );

  // วิชาเอกครบทั้ง 12 — มีข้อมูลก็แสดง ไม่มีก็ขึ้น "ยังไม่มีข้อมูล"
  const majorCards = useMemo(() => {
    return allMajors
      .filter((m) => majorFilter === "all" || m.code === majorFilter)
      .map((m) => {
        const lists = sources
          .map((src) => ({
            src,
            items: ranks
              .filter((r) => r.source_id === src.id && r.major_code === m.code)
              .sort((a, b) => a.rank_order - b.rank_order)
              .map((r) => ({ name: r.name, order: r.rank_order }))
              .filter((x) => !term || x.name.toLowerCase().includes(term)),
          }))
          .filter((l) => l.items.length > 0);
        return { ...m, lists };
      })
      .filter((m) => !term || m.lists.length > 0);
  }, [allMajors, majorFilter, sources, ranks, term]);

  const majorsWithData = new Set(ranks.map((r) => r.major_code)).size;
  const total = ranked.reduce((x, y) => x + y.applicants, 0);
  const chartData = ranked.slice(0, 10).map((x) => ({
    name: x.name.replace(/^โรงเรียน/, "").slice(0, 26),
    full: x.name,
    applicants: x.applicants,
    rank: x.rank,
  }));

  if (error)
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-3">
          <p className="text-red-600">โหลดข้อมูลโรงเรียนไม่สำเร็จ: {error}</p>
          <Button variant="outline" size="sm" onClick={retry}>ลองอีกครั้ง</Button>
        </CardContent>
      </Card>
    );
  if (!data)
    return <Card><CardContent className="py-14 text-center text-muted-foreground">กำลังโหลดข้อมูลโรงเรียน...</CardContent></Card>;

  const hasData = applicants.length > 0 || ranks.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <School className="h-6 w-6" style={{ color }} />
            {title}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {label} · ค้นหาโรงเรียนและดูอันดับผู้สมัคร (หน่วย: คน)
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

      <div className="flex flex-col md:flex-row gap-3">
        {!table && (
          <div className="flex flex-wrap gap-2">
            {[{ value: "all", label: "ทุกรอบ" }, ...TCAS_ROUNDS].map((r) => {
              const n = r.value === "all" ? data.applicants.length : data.applicants.filter((x) => `tcas_${x.round}` === r.value).length;
              const active = round === r.value;
              return (
                <Button key={r.value} size="sm" variant={active ? "default" : "outline"} onClick={() => setRound(r.value)} className="rounded-full">
                  {r.label}
                  <span className={`ml-2 text-xs ${active ? "opacity-80" : "text-muted-foreground"}`}>{n}</span>
                </Button>
              );
            })}
          </div>
        )}
        <div className="relative md:ml-auto md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="ค้นหาชื่อโรงเรียน..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-9" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground" aria-label="ล้างคำค้นหา">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {!hasData && view === "overall" ? (
        <Card>
          <CardContent className="py-14 text-center text-muted-foreground">
            <School className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            ยังไม่มีข้อมูลโรงเรียนของ {roundNo ? `TCAS รอบ ${roundNo}` : "รอบนี้"}
          </CardContent>
        </Card>
      ) : view === "overall" ? (
        <>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      {chartData.map((d) => <Cell key={d.full} fill={color} fillOpacity={d.rank <= 3 ? 1 : 0.5} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

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
        </>
      ) : (
        <div className="space-y-6">
          <div className="w-full md:w-96">
            <Select value={majorFilter} onValueChange={setMajorFilter}>
              <SelectTrigger><SelectValue placeholder="เลือกวิชาเอก" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกวิชาเอก ({allMajors.length})</SelectItem>
                {allMajors.map((m) => <SelectItem key={m.code} value={m.code}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {majorCards.length === 0 && (
            <p className="py-10 text-center text-muted-foreground">ไม่พบโรงเรียนที่ตรงกับ “{search}”</p>
          )}
          {MAJOR_GROUPS.map((g) => {
            const cards = majorCards.filter((m) => m.code.startsWith(g.prefix));
            if (cards.length === 0) return null;
            return (
              <section key={g.prefix} className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">{g.name}</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {cards.map((m) => (
                    <Card key={m.code} className={m.lists.length === 0 ? "border-dashed bg-gray-50/60" : ""}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle className="text-base">{m.name}</CardTitle>
                          <Badge variant={m.lists.length ? "outline" : "secondary"} className="whitespace-nowrap font-normal">
                            {m.lists.length ? `${m.lists.reduce((x, l) => x + l.items.length, 0)} โรงเรียน` : "ยังไม่มีข้อมูล"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {m.lists.length === 0 ? (
                          <p className="py-4 text-sm text-muted-foreground">ยังไม่มีข้อมูลโรงเรียนของวิชาเอกนี้</p>
                        ) : (
                          m.lists.map((l) => (
                            <div key={l.src.id}>
                              {sources.length > 1 && <p className="text-xs text-muted-foreground mb-1">{formatSource(l.src)}</p>}
                              <ol className="divide-y">
                                {l.items.map((x) => (
                                  <li key={x.name} className="flex items-center gap-3 py-2 text-sm">
                                    <span className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: color }}>{x.order}</span>
                                    <span className="truncate" title={x.name}>{x.name}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}