"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";

type TableTCASProps = {
  year?: string;
};

type TCASRow = {
  id: string;
  year: string;
  major: string;
  quota: number;
  applicants: number;
  interview_eligible?: number | null;
  interview_attended?: number | null;
  qualified: number;
  confirmed: number;
  registered: number;
};

export default function TableTCAS2({ year }: TableTCASProps) {
  const [rows, setRows] = useState<TCASRow[]>([]);
  const [fontBase64, setFontBase64] = useState<string>("");

  // ฟังก์ชันช่วยแปลงค่า null/undefined เป็น "-"
  const formatValue = (val: number | string | null | undefined) => val ?? "-";

  // คำนวณแถวรวม
  const totalRow = {
    major: "รวม",
    quota: rows.reduce((sum, r) => sum + (r.quota ?? 0), 0),
    applicants: rows.reduce((sum, r) => sum + (r.applicants ?? 0), 0),
    interview_eligible: rows.some(r => r.interview_eligible === null || r.interview_eligible === undefined)
      ? "-" 
      : rows.reduce((sum, r) => sum + (r.interview_eligible ?? 0), 0),
    interview_attended: rows.some(r => r.interview_attended === null || r.interview_attended === undefined)
      ? "-" 
      : rows.reduce((sum, r) => sum + (r.interview_attended ?? 0), 0),
    qualified: rows.reduce((sum, r) => sum + (r.qualified ?? 0), 0),
    confirmed: rows.reduce((sum, r) => sum + (r.confirmed ?? 0), 0),
    registered: rows.reduce((sum, r) => sum + (r.registered ?? 0), 0),
  };

  useEffect(() => {
    // โหลดข้อมูลและฟอนต์พร้อมกัน
    const url = year ? `/api/tcas_2?year=${year}` : "/api/tcas_2";
    
    Promise.all([
      fetch(url).then(res => res.json()),
      fetch('/sarabun-light.base64.txt').then(res => res.text())
    ]).then(([data, font]) => {
      setRows(data);
      setFontBase64(font);
    });
  }, [year]);

  const createPDFTable = (doc: jsPDF) => {
    if (fontBase64) {
      doc.addFileToVFS("Sarabun-Light.ttf", fontBase64);
      doc.addFont("Sarabun-Light.ttf", "Sarabun-Light", "normal");
      doc.setFont("Sarabun-Light", "normal");
    }
    
    doc.setFontSize(18);
    doc.text(`รายงานสถิติ TCAS2 ปี ${year}`, 15, 45);

    autoTable(doc, {
      startY: 55,
      head: [[
        "สาขา / วิชาเอก", "จำนวนรับ", "ผู้สมัคร", "มีสิทธิ์สัมภาษณ์",
        "เข้าสัมภาษณ์", "ผ่านการคัดเลือก", "ยืนยันสิทธิ์", "รายงานตัว"
      ]],
      body: [
        ...rows.map(r => [
          formatValue(r.major),
          formatValue(r.quota),
          formatValue(r.applicants),
          formatValue(r.interview_eligible),
          formatValue(r.interview_attended),
          formatValue(r.qualified),
          formatValue(r.confirmed),
          formatValue(r.registered)
        ]),
        [
          formatValue(totalRow.major),
          formatValue(totalRow.quota),
          formatValue(totalRow.applicants),
          formatValue(totalRow.interview_eligible),
          formatValue(totalRow.interview_attended),
          formatValue(totalRow.qualified),
          formatValue(totalRow.confirmed),
          formatValue(totalRow.registered)
        ]
      ],
      theme: "grid",
      styles: {
        font: fontBase64 ? "Sarabun-Light" : "helvetica",
        fontSize: 10,
      },
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: [0, 0, 0],
        fontStyle: "normal",
        font: fontBase64 ? "Sarabun-Light" : "helvetica",
      },
    });

    doc.save(`cosci_tcas1_${year}.pdf`);
  };

  const exportPDF = async () => {
    const doc = new jsPDF({ orientation: "landscape" });
    const logo = "/Logocosci.png";

    try {
      const response = await fetch(logo);
      const blob = await response.blob();
      
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          doc.addImage(base64, "PNG", 10, 10, 72, 24);
          createPDFTable(doc);
          resolve();
        };
        reader.readAsDataURL(blob);
      });
    } catch {
      createPDFTable(doc);
    }
  };

  return (
    <div className="space-y-4">
      <div className="w-full border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-300 text-center">
              <TableHead>สาขา / วิชาเอก</TableHead>
              <TableHead>จำนวนรับ</TableHead>
              <TableHead>จำนวนผู้สมัคร</TableHead>
              <TableHead>มีสิทธิ์สอบสัมภาษณ์</TableHead>
              <TableHead>เข้าสัมภาษณ์</TableHead>
              <TableHead>ผ่านการคัดเลือก</TableHead>
              <TableHead>ยืนยันสิทธิ์</TableHead>
              <TableHead>รายงานตัว</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map(item => (
              <TableRow key={item.id} className="odd:bg-muted/50">
                <TableCell>{formatValue(item.major)}</TableCell>
                <TableCell>{formatValue(item.quota)}</TableCell>
                <TableCell>{formatValue(item.applicants)}</TableCell>
                <TableCell>{formatValue(item.interview_eligible)}</TableCell>
                <TableCell>{formatValue(item.interview_attended)}</TableCell>
                <TableCell>{formatValue(item.qualified)}</TableCell>
                <TableCell>{formatValue(item.confirmed)}</TableCell>
                <TableCell>{formatValue(item.registered)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-gray-200 font-bold">
              <TableCell>{formatValue(totalRow.major)}</TableCell>
              <TableCell>{formatValue(totalRow.quota)}</TableCell>
              <TableCell>{formatValue(totalRow.applicants)}</TableCell>
              <TableCell>{formatValue(totalRow.interview_eligible)}</TableCell>
              <TableCell>{formatValue(totalRow.interview_attended)}</TableCell>
              <TableCell>{formatValue(totalRow.qualified)}</TableCell>
              <TableCell>{formatValue(totalRow.confirmed)}</TableCell>
              <TableCell>{formatValue(totalRow.registered)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={exportPDF}
          className="px-4 py-2 bg-blue-400 text-black rounded shadow hover:bg-blue-500"
          disabled={!fontBase64}
        >
          {fontBase64 ? "Export Table as PDF" : "กำลังโหลดฟอนต์..."}
        </Button>
      </div>
    </div>
  );
}
