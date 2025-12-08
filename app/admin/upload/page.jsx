"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function UploadTCAS() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      toast.error("กรุณาเลือกไฟล์");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-tcas", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error("อัปโหลดไม่สำเร็จ", {
          description: data.error,
        });
        setLoading(false);
        return;
      }

      toast.success("อัปโหลดสำเร็จ 🎉", {
        description: `เพิ่มข้อมูล ${data.inserted} แถว (รอบ ${data.round}, ปี ${data.year})`,
      });

      setFile(null);
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด", {
        description: error.message,
      });
    }

    setLoading(false);
  };

  return (
    <div className="p-6 w-full max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">
        Upload TCAS (Excel / CSV)
      </h1>

      <div className="space-y-4">
        <div>
          <Label className="mb-2 block">เลือกไฟล์</Label>
          <Input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setFile(e.target.files[0])}
          />
          {file && (
            <p className="text-sm text-gray-600 mt-2">
              📄 ไฟล์ที่เลือก: <b>{file.name}</b>
            </p>
          )}
        </div>

        <Button
          onClick={handleUpload}
          disabled={loading}
          className="w-full"
        >
          {loading ? "กำลังอัปโหลด..." : "อัปโหลดข้อมูล"}
        </Button>
      </div>
    </div>
  );
}
