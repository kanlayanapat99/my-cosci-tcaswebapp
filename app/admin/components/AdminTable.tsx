"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PencilLine } from "lucide-react";

export type TCASRow = {
  id: string;
  major: string;
  quota: number | null;
  applicants: number | null;
  interview_eligible: number | null;
  interview_attended: number | null;
  qualified: number | null;
  confirmed: number | null;
  registered: number | null;
};

type AdminTableProps = {
  apiPath: string;
};

export default function AdminTable({ apiPath }: AdminTableProps) {
  const router = useRouter();
  const [rows, setRows] = useState<TCASRow[]>([]);
  const [isDirty, setDirty] = useState(false);

  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState<string | null>(null); // row.id
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(apiPath);
      const data: TCASRow[] = await res.json();
      setRows(data);
    }
    load();
  }, [apiPath]);

  const parseNumberOrNull = (val: string): number | null => {
    if (val.trim() === "") return null;
    const n = Number(val);
    return isNaN(n) ? null : n;
  };

  const onEdit = <K extends keyof TCASRow>(
    index: number,
    field: K,
    value: TCASRow[K]
  ) => {
    const clone = [...rows];
    clone[index][field] = value;
    setRows(clone);
    setDirty(true);
  };

  const saveTable = async () => {
    try {
      await Promise.all(
        rows.map((r) =>
          fetch(apiPath, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(r),
          })
        )
      );
      setDirty(false);
      alert("บันทึกข้อมูลสำเร็จ!");
    } catch (err) {
      console.error(err);
      alert("บันทึกผิดพลาด");
    }
  };

  const handleBack = () => {
    if (!isDirty) {
      router.back();
    } else {
      setConfirmDialogOpen(true); // เปิด custom confirm dialog
    }
  };

  const handleConfirmBack = (save: boolean) => {
    if (save) {
      saveTable().then(() => router.back());
    } else {
      router.back();
    }
    setConfirmDialogOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* Back + Save */}
      <div className="flex justify-between items-center mb-4">
        <Button onClick={handleBack} variant="outline" className="text-gray-700">
          Back
        </Button>

        <Button onClick={saveTable} disabled={!isDirty} className="bg-blue-500 hover:bg-blue-600 text-white">
          Save Table
        </Button>
      </div>

      {/* ตาราง */}
      <div className="w-full border rounded-lg overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-200 text-center">
              <TableHead>สาขา / วิชาเอก</TableHead>
              <TableHead>จำนวนรับ</TableHead>
              <TableHead>ผู้สมัคร</TableHead>
              <TableHead>มีสิทธิ์สัมภาษณ์</TableHead>
              <TableHead>เข้าสัมภาษณ์</TableHead>
              <TableHead>ผ่านการคัดเลือก</TableHead>
              <TableHead>ยืนยันสิทธิ์</TableHead>
              <TableHead>รายงานตัว</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={r.id} className="odd:bg-gray-50">
                <TableCell>{r.major}</TableCell>
                <TableCell>{r.quota ?? "-"}</TableCell>
                <TableCell>{r.applicants ?? "-"}</TableCell>
                <TableCell>{r.interview_eligible ?? "-"}</TableCell>
                <TableCell>{r.interview_attended ?? "-"}</TableCell>
                <TableCell>{r.qualified ?? "-"}</TableCell>
                <TableCell>{r.confirmed ?? "-"}</TableCell>
                <TableCell>{r.registered ?? "-"}</TableCell>

                <TableCell>
                  <Dialog open={editDialogOpen === r.id} onOpenChange={(open) => setEditDialogOpen(open ? r.id : null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost">
                        <PencilLine className="w-5 h-5 text-blue-600" />
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="rounded-xl">
                      <DialogHeader>
                        <DialogTitle>แก้ไขข้อมูล</DialogTitle>
                      </DialogHeader>

                      <div className="space-y-4">
                        {/* ชื่อเอก แก้ไม่ได้ */}
                        <input className="border p-2 rounded-lg w-full bg-gray-100 cursor-not-allowed" value={r.major} readOnly />

                        <div className="grid grid-cols-2 gap-3">
                          <input className="border p-2 rounded-lg" type="text" placeholder="จำนวนรับ" value={r.quota ?? ""} onChange={(e) => onEdit(i, "quota", parseNumberOrNull(e.target.value))} />
                          <input className="border p-2 rounded-lg" type="text" placeholder="ผู้สมัคร" value={r.applicants ?? ""} onChange={(e) => onEdit(i, "applicants", parseNumberOrNull(e.target.value))} />
                          <input className="border p-2 rounded-lg" type="text" placeholder="มีสิทธิ์สัมภาษณ์" value={r.interview_eligible ?? ""} onChange={(e) => onEdit(i, "interview_eligible", parseNumberOrNull(e.target.value))} />
                          <input className="border p-2 rounded-lg" type="text" placeholder="เข้าสัมภาษณ์" value={r.interview_attended ?? ""} onChange={(e) => onEdit(i, "interview_attended", parseNumberOrNull(e.target.value))} />
                          <input className="border p-2 rounded-lg" type="text" placeholder="ผ่านการคัดเลือก" value={r.qualified ?? ""} onChange={(e) => onEdit(i, "qualified", parseNumberOrNull(e.target.value))} />
                          <input className="border p-2 rounded-lg" type="text" placeholder="ยืนยันสิทธิ์" value={r.confirmed ?? ""} onChange={(e) => onEdit(i, "confirmed", parseNumberOrNull(e.target.value))} />
                          <input className="border p-2 rounded-lg" type="text" placeholder="รายงานตัว" value={r.registered ?? ""} onChange={(e) => onEdit(i, "registered", parseNumberOrNull(e.target.value))} />
                        </div>

                        <DialogFooter>
                          <Button onClick={() => setEditDialogOpen(null)}>Done</Button>
                        </DialogFooter>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Custom Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="rounded-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Unsaved Changes</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-center">
            <p>Do you want to save your changes before leaving?</p>
            <div className="flex justify-center gap-2">
              <Button 
                onClick={() => handleConfirmBack(true)} 
                className="bg-blue-500 hover:bg-blue-600 text-white min-w-24"
              >
                Save & Leave
              </Button>
              <Button 
                onClick={() => handleConfirmBack(false)} 
                variant="outline"
                className="min-w-24"
              >
                Discard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
