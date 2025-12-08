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
  DialogDescription,
} from "@/components/ui/dialog";
import { PencilLine, Trash2, AlertTriangle } from "lucide-react";

export type TCASRow = {
  id: string;
  year: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const [tableInfo, setTableInfo] = useState({ table: "", year: "" });

  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch(apiPath);
        const data: TCASRow[] = await res.json();
        setRows(data);
        
        // Parse table and year from apiPath
        const match = apiPath.match(/\/api\/tcas\/(tcas_[1-4])\?year=(\d+)/);
        if (match) {
          setTableInfo({ table: match[1], year: match[2] });
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
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
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTable = async () => {
    if (confirmText !== "DELETE") {
      alert('กรุณาพิมพ์คำว่า "DELETE" เพื่อยืนยันการลบ');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(apiPath, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.status === "success") {
        alert(`ลบข้อมูลสำเร็จ! (ลบไป ${result.deletedCount} แถว)`);
        setRows([]);
        setDeleteDialogOpen(false);
        setConfirmText("");
        
        // โหลดข้อมูลใหม่
        const res = await fetch(apiPath);
        const data: TCASRow[] = await res.json();
        setRows(data);
      } else {
        throw new Error(result.error || "เกิดข้อผิดพลาดในการลบข้อมูล");
      }
    } catch (err: unknown) {
      console.error("Delete error:", err);
      let errorMessage = "ลบข้อมูลไม่สำเร็จ";
      
      if (err instanceof Error) {
        errorMessage += `: ${err.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (!isDirty) {
      router.back();
    } else {
      setConfirmDialogOpen(true);
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
      {/* Back + Save + Delete */}
      <div className="flex justify-between items-center mb-4">
        <Button 
          onClick={handleBack} 
          variant="outline" 
          className="text-gray-700"
          disabled={isLoading}
        >
          Back
        </Button>

        <div className="flex gap-2">
          <Button 
            onClick={saveTable} 
            disabled={!isDirty || isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isLoading ? "กำลังบันทึก..." : "Save Table"}
          </Button>
          
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="destructive"
                className="bg-red-500 hover:bg-red-600 text-white"
                disabled={isLoading || rows.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Data
              </Button>
            </DialogTrigger>

            <DialogContent className="rounded-xl max-w-md">
              <DialogHeader>
                <DialogTitle className="text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  ยืนยันการลบข้อมูล
                </DialogTitle>
                <DialogDescription className="pt-2">
                  คุณกำลังจะลบข้อมูลทั้งหมดในตารางนี้
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="font-semibold text-red-700">
                    ตาราง {tableInfo.table.toUpperCase()} ปี {tableInfo.year}
                  </p>
                  <p className="text-red-600 text-sm mt-1">
                    • จำนวนข้อมูลที่จะถูกลบ: {rows.length} แถว
                  </p>
                  <p className="text-red-600 text-sm">
                    • การดำเนินการนี้ไม่สามารถย้อนกลับได้
                  </p>
                </div>

                <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    ข้อมูลที่ถูกลบจะหายไปอย่างถาวร และไม่สามารถกู้คืนได้ 
                    กรุณาตรวจสอบให้แน่ใจก่อนดำเนินการ
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    พิมพ์คำว่า &quot;DELETE&quot; เพื่อยืนยัน:
                  </label>
                  <input
                    type="text"
                    placeholder='พิมพ์ "DELETE" เพื่อยืนยัน'
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>

              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setConfirmText("");
                  }}
                  disabled={isLoading}
                >
                  ยกเลิก
                </Button>
                <Button
                  variant="destructive"
                  onClick={deleteTable}
                  disabled={isLoading || confirmText !== "DELETE"}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {isLoading ? "กำลังลบ..." : "ลบข้อมูล"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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
              <TableRow key={r.id} className="odd:bg-gray-50 hover:bg-gray-50">
                <TableCell className="font-medium">{r.major}</TableCell>
                <TableCell className="text-center">{r.quota ?? "-"}</TableCell>
                <TableCell className="text-center">{r.applicants ?? "-"}</TableCell>
                <TableCell className="text-center">{r.interview_eligible ?? "-"}</TableCell>
                <TableCell className="text-center">{r.interview_attended ?? "-"}</TableCell>
                <TableCell className="text-center">{r.qualified ?? "-"}</TableCell>
                <TableCell className="text-center">{r.confirmed ?? "-"}</TableCell>
                <TableCell className="text-center">{r.registered ?? "-"}</TableCell>

                <TableCell>
                  <Dialog open={editDialogOpen === r.id} onOpenChange={(open) => setEditDialogOpen(open ? r.id : null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <PencilLine className="w-4 h-4 text-blue-600" />
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="rounded-xl max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>แก้ไขข้อมูลสาขา: {r.major}</DialogTitle>
                      </DialogHeader>

                      <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              สาขา/วิชาเอก
                            </label>
                            <input 
                              className="border p-2 rounded-lg w-full bg-gray-50 cursor-not-allowed" 
                              value={r.major} 
                              readOnly 
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              จำนวนรับ
                            </label>
                            <input 
                              className="border p-2 rounded-lg w-full" 
                              type="number" 
                              placeholder="จำนวนรับ" 
                              value={r.quota ?? ""} 
                              onChange={(e) => onEdit(i, "quota", parseNumberOrNull(e.target.value))} 
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ผู้สมัคร
                            </label>
                            <input 
                              className="border p-2 rounded-lg w-full" 
                              type="number" 
                              placeholder="ผู้สมัคร" 
                              value={r.applicants ?? ""} 
                              onChange={(e) => onEdit(i, "applicants", parseNumberOrNull(e.target.value))} 
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              มีสิทธิ์สัมภาษณ์
                            </label>
                            <input 
                              className="border p-2 rounded-lg w-full" 
                              type="number" 
                              placeholder="มีสิทธิ์สัมภาษณ์" 
                              value={r.interview_eligible ?? ""} 
                              onChange={(e) => onEdit(i, "interview_eligible", parseNumberOrNull(e.target.value))} 
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              เข้าสัมภาษณ์
                            </label>
                            <input 
                              className="border p-2 rounded-lg w-full" 
                              type="number" 
                              placeholder="เข้าสัมภาษณ์" 
                              value={r.interview_attended ?? ""} 
                              onChange={(e) => onEdit(i, "interview_attended", parseNumberOrNull(e.target.value))} 
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ผ่านการคัดเลือก
                            </label>
                            <input 
                              className="border p-2 rounded-lg w-full" 
                              type="number" 
                              placeholder="ผ่านการคัดเลือก" 
                              value={r.qualified ?? ""} 
                              onChange={(e) => onEdit(i, "qualified", parseNumberOrNull(e.target.value))} 
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ยืนยันสิทธิ์
                            </label>
                            <input 
                              className="border p-2 rounded-lg w-full" 
                              type="number" 
                              placeholder="ยืนยันสิทธิ์" 
                              value={r.confirmed ?? ""} 
                              onChange={(e) => onEdit(i, "confirmed", parseNumberOrNull(e.target.value))} 
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              รายงานตัว
                            </label>
                            <input 
                              className="border p-2 rounded-lg w-full" 
                              type="number" 
                              placeholder="รายงานตัว" 
                              value={r.registered ?? ""} 
                              onChange={(e) => onEdit(i, "registered", parseNumberOrNull(e.target.value))} 
                            />
                          </div>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button onClick={() => setEditDialogOpen(null)}>
                          บันทึกการเปลี่ยนแปลง
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Custom Confirm Dialog สำหรับกลับหน้าเดิม */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="rounded-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">มีข้อมูลที่ยังไม่ได้บันทึก</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-center">
            <p>คุณต้องการบันทึกการเปลี่ยนแปลงก่อนออกจากหน้านี้หรือไม่?</p>
            <div className="flex justify-center gap-2">
              <Button 
                onClick={() => handleConfirmBack(true)} 
                className="bg-blue-500 hover:bg-blue-600 text-white min-w-24"
              >
                บันทึก & ออก
              </Button>
              <Button 
                onClick={() => handleConfirmBack(false)} 
                variant="outline"
                className="min-w-24"
              >
                ไม่บันทึก
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}