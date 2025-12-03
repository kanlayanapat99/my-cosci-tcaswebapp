// app/admin/page.tsx (หรือ .jsx)
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/customized/select/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectLabel,
  SelectGroup,
} from "@/components/customized/select/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Summary = {
  table: string;
  years: string[];
};

export default function AdminDashboard() {
  const router = useRouter();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [filterRound, setFilterRound] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  
  const [open, setOpen] = useState(false);
  const [round, setRound] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const tcasTables = ["tcas_1", "tcas_2", "tcas_3", "tcas_4"];
      const cards: Summary[] = [];

      for (const table of tcasTables) {
        try {
          const res = await fetch(`/api/${table}/years`);
          if (res.ok) {
            const yearsData = await res.json();
            const years = yearsData.map((y: { year: string }) =>
              String(y.year).trim()
            );
            cards.push({ table, years });
          }
        } catch (error) {
          console.error(`Error loading ${table}:`, error);
        }
      }

      setSummaries(cards);
    }
    load();
  }, []);

  const handleAddTable = async () => {
  if (!round || !year) {
    toast.error("Select TCAS round and enter year");
    return;
  }

  if (!/^\d{4}$/.test(year)) {
    toast.error("Year must be a 4-digit number");
    return;
  }

  setLoading(true);
  try {
    const response = await fetch('/api/tables', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ round, year }),
    });

    const data = await response.json();

    // ใน handleAddTable แก้ไขส่วนที่จัดการ error:
    if (!response.ok) {
      // ใช้ toast.warning แทน toast.error สำหรับกรณีที่ข้อมูลซ้ำ
      if (data.error?.includes('already exists')) {
        toast.warning(data.error, {
          duration: 5000,
          style: {
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #f59e0b',
          },
        });
      } else {
        toast.error(data.error || 'Error creating table');
      }
      setLoading(false);
      return;
    }

    toast.success(`Create new table TCAS${round} ${year} successfully`);
    
    // ปิด Dialog
    setOpen(false);
    setRound("");
    setYear("");
    
    // รีเฟรชข้อมูล
    const tcasTables = ["tcas_1", "tcas_2", "tcas_3", "tcas_4"];
    const updatedCards: Summary[] = [];
    
    for (const table of tcasTables) {
      try {
        const res = await fetch(`/api/${table}/years`);
        if (res.ok) {
          const yearsData = await res.json();
          const years = yearsData.map((y: { year: string }) =>
            String(y.year).trim()
          );
          updatedCards.push({ table, years });
        }
      } catch (fetchError: unknown) {
        console.error(`Error loading ${table}:`, fetchError);
      }
    }
    
    setSummaries(updatedCards);
    
    // Redirect ไปยังหน้าแก้ไขตารางที่สร้างใหม่
    router.push(`/admin/tcas_${round}/${year}`);
    
  } catch (error: unknown) {
    console.error('Error creating table:', error);
    
    if (error instanceof Error) {
      toast.error(error.message);
    } else if (typeof error === 'string') {
      toast.error(error);
    } else {
      toast.error('An unknown error occurred');
    }
  } finally {
    setLoading(false);
  }
};

  const filtered = summaries.filter((s) => {
    const matchRound =
      filterRound === "all" || s.table === `tcas_${filterRound}`;

    const normalizedYears = s.years.map((y) => String(y).trim());
    const selectedYear = String(filterYear).trim();

    const matchYear =
      filterYear === "all" || normalizedYears.includes(selectedYear);

    return matchRound && matchYear;
  });

  const allYears = Array.from(
    new Set(summaries.flatMap((s) => s.years.map((y) => y.trim())))
  ).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="p-8 space-y-6">
      <h2 className="text-xl font-bold">Admin page</h2>
      <p className="text-gray-500">Upload or edit data</p>

      <div className="flex gap-6">
        <div className="w-40">
          <Label className="mb-2 block">Round</Label>
          <Select defaultValue="all" onValueChange={(v) => setFilterRound(v)}>
            <SelectTrigger className="rounded-full">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="1">TCAS1</SelectItem>
                <SelectItem value="2">TCAS2</SelectItem>
                <SelectItem value="3">TCAS3</SelectItem>
                <SelectItem value="4">TCAS4</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="w-40">
          <Label className="mb-2 block">Year</Label>
          <Select defaultValue="all" onValueChange={(v) => setFilterYear(v)}>
            <SelectTrigger className="rounded-full">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All</SelectItem>
                {allYears.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <div className="w-full h-40 flex items-center justify-center border-2 border-dashed rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="text-center">
                <div className="text-2xl mb-2">+</div>
                <div className="font-medium">Add Table</div>
              </div>
            </div>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Table</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="round">TCAS Round</Label>
                <Select value={round} onValueChange={setRound}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select round" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Select TCAS</SelectLabel>
                      <SelectItem value="1">TCAS 1</SelectItem>
                      <SelectItem value="2">TCAS 2</SelectItem>
                      <SelectItem value="3">TCAS 3</SelectItem>
                      <SelectItem value="4">TCAS 4</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="เช่น 2567"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter Year (exp. 2567)
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddTable}
                disabled={loading || !round || !year}
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Table'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {filtered.map((s) =>
          s.years
            .filter((y) => filterYear === "all" || y === filterYear)
            .map((y) => (
              <Link 
                key={`${s.table}-${y}`} 
                href={`/admin/${s.table}/${y}`}
                className="block"
              >
                <div className="h-40 border rounded-md p-4 shadow-sm hover:bg-gray-50 cursor-pointer flex flex-col justify-between transition-colors">
                  <div className="font-semibold text-lg">
                    {s.table.replace('tcas_', 'TCAS ').toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-500">ปีการศึกษา {y}</div>
                  <div className="text-xs text-blue-600 mt-2">
                    คลิกเพื่อแก้ไข →
                  </div>
                </div>
              </Link>
            ))
        )}
      </div>
    </div>
  );
}