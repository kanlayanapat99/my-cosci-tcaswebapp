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
import { Download } from "lucide-react";

type TableTCASProps = {
  table: string; // เช่น "tcas_1", "tcas_2"
  year?: string;
};

type TCASRow = {
  id: string;
  year: string;
  major: string;
  quota: number | null;
  applicants: number | null;
  interview_eligible?: number | null;
  interview_attended?: number | null;
  qualified: number | null;
  confirmed: number | null;
  registered: number | null;
};

export default function TableTCAS({ table, year }: TableTCASProps) {
  const [rows, setRows] = useState<TCASRow[]>([]);
  const [fontBase64, setFontBase64] = useState<string>("");

  // ฟังก์ชันช่วยแปลงค่า null/undefined เป็น "-"
  const formatValue = (val: number | string | null | undefined) => val ?? "-";

  const calculateAndFormat = (rows: TCASRow[], key: keyof TCASRow) => {
    const sum = rows.reduce((total, r) => {
        const value = r[key];
        // ตรวจสอบ type ก่อนใช้งาน
        if (typeof value === 'number') {
        return total + value;
        }
        return total + 0; // ถ้าเป็น null หรือ undefined ให้เป็น 0
    }, 0);
    
    // ถ้าผลรวมเป็น 0 และทุกค่าเป็น null/undefined ให้เป็น "-"
    if (sum === 0 && rows.every(r => {
        const value = r[key];
        return value === null || value === undefined;
    })) {
        return "-";
    }
    return sum;
    };

    // ใช้กับทุกคอลัมน์
        const totalRow = {
        major: "รวม",
        quota: calculateAndFormat(rows, "quota"),
        applicants: calculateAndFormat(rows, "applicants"),
        interview_eligible: calculateAndFormat(rows, "interview_eligible"),
        interview_attended: calculateAndFormat(rows, "interview_attended"),
        qualified: calculateAndFormat(rows, "qualified"),
        confirmed: calculateAndFormat(rows, "confirmed"),
        registered: calculateAndFormat(rows, "registered"),
        };

  useEffect(() => {
    const url = year ? `/api/tcas/${table}?year=${year}` : `/api/tcas/${table}`;
    
    Promise.all([
      fetch(url).then(res => res.json()),
      fetch('/sarabun-light.base64.txt').then(res => res.text())
    ]).then(([data, font]) => {
      setRows(data);
      setFontBase64(font);
    });
  }, [table, year]);

  const createPDFTable = (doc: jsPDF) => {
    if (fontBase64) {
      doc.addFileToVFS("Sarabun-Light.ttf", fontBase64);
      doc.addFont("Sarabun-Light.ttf", "Sarabun-Light", "normal");
      doc.setFont("Sarabun-Light", "normal");
    }
    
    const tableName = table.toUpperCase().replace('_', ' ');
    doc.setFontSize(18);
    doc.text(`รายงานสถิติ ${tableName} ปี ${year}`, 15, 45);

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

    doc.save(`cosci_${table}_${year}.pdf`);
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Table {table.toUpperCase().replace('_', ' ')}</h2>
        <div className="flex items-center gap-4">
          <Button 
            onClick={exportPDF} 
            variant="outline" 
            size="sm"
            className="gap-2 hover:bg-blue-300"
            disabled={!fontBase64}
          >
            <Download className="h-4 w-4" />
            {fontBase64 ? "Export Table as PDF" : "กำลังโหลดฟอนต์..."}
          </Button>
        </div>
      </div>

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
    </div>
  );
}