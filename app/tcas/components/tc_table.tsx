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
  table: string;
  years: string[];
  major?: string;
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

// Extend jsPDF type to include autoTable
interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
  autoTable?: (options: any) => JsPDFWithAutoTable;
}

export default function TableTCAS({ table, years, major = "all" }: TableTCASProps) {
  const [rows, setRows] = useState<TCASRow[]>([]);
  const [fontBase64, setFontBase64] = useState<string>("");

  const formatValue = (val: number | string | null | undefined) => val ?? "-";

  const calculateAndFormat = (rows: TCASRow[], key: keyof TCASRow) => {
    const sum = rows.reduce((total, r) => {
      const value = r[key];
      if (typeof value === 'number') {
        return total + value;
      }
      return total + 0;
    }, 0);
    
    if (sum === 0 && rows.every(r => {
      const value = r[key];
      return value === null || value === undefined;
    })) {
      return "-";
    }
    return sum;
  };

  // Group by year for summary
  const groupByYear = rows.reduce((acc, row) => {
    if (!acc[row.year]) {
      acc[row.year] = [];
    }
    acc[row.year].push(row);
    return acc;
  }, {} as Record<string, TCASRow[]>);

  // Calculate totals per year
  const yearlyTotals = Object.entries(groupByYear).map(([year, yearRows]) => ({
    year,
    quota: calculateAndFormat(yearRows, "quota"),
    applicants: calculateAndFormat(yearRows, "applicants"),
    interview_eligible: calculateAndFormat(yearRows, "interview_eligible"),
    interview_attended: calculateAndFormat(yearRows, "interview_attended"),
    qualified: calculateAndFormat(yearRows, "qualified"),
    confirmed: calculateAndFormat(yearRows, "confirmed"),
    registered: calculateAndFormat(yearRows, "registered"),
  }));

  // Calculate grand totals
  const totalRow = {
    major: "รวมทั้งหมด",
    quota: calculateAndFormat(rows, "quota"),
    applicants: calculateAndFormat(rows, "applicants"),
    interview_eligible: calculateAndFormat(rows, "interview_eligible"),
    interview_attended: calculateAndFormat(rows, "interview_attended"),
    qualified: calculateAndFormat(rows, "qualified"),
    confirmed: calculateAndFormat(rows, "confirmed"),
    registered: calculateAndFormat(rows, "registered"),
  };

  useEffect(() => {
    const yearsParam = years.join(',');
    const url = `/api/tcas/${table}?years=${yearsParam}${major !== "all" ? `&major=${major}` : ''}`;
    
    Promise.all([
      fetch(url).then(res => res.json()),
      fetch('/sarabun-light.base64.txt').then(res => res.text())
    ]).then(([data, font]) => {
      setRows(data);
      setFontBase64(font);
    });
  }, [table, years, major]);

  const createPDFTable = (doc: jsPDF) => {
    const pdfDoc = doc as JsPDFWithAutoTable;
    
    if (fontBase64) {
      pdfDoc.addFileToVFS("Sarabun-Light.ttf", fontBase64);
      pdfDoc.addFont("Sarabun-Light.ttf", "Sarabun-Light", "normal");
      pdfDoc.setFont("Sarabun-Light", "normal");
    }
    
    const tableName = table.toUpperCase().replace('_', ' ');
    const yearsText = years.join(', ');
    const majorText = major === "all" ? "All Majors" : major;
    
    pdfDoc.setFontSize(18);
    pdfDoc.text(`รายงานสถิติ ${tableName}`, 15, 45);
    pdfDoc.setFontSize(12);
    pdfDoc.text(`ปีการศึกษา: ${yearsText}`, 15, 55);
    pdfDoc.text(`สาขา: ${majorText}`, 15, 65);

    autoTable(pdfDoc, {
      startY: 70,
      head: [[
        "ปี", "สาขา", "จำนวนรับ", "ผู้สมัคร", "มีสิทธิ์สัมภาษณ์",
        "เข้าสัมภาษณ์", "ผ่านการคัดเลือก", "ยืนยันสิทธิ์", "รายงานตัว"
      ]],
      body: [
        ...rows.map(r => [
          r.year,
          r.major,
          formatValue(r.quota),
          formatValue(r.applicants),
          formatValue(r.interview_eligible),
          formatValue(r.interview_attended),
          formatValue(r.qualified),
          formatValue(r.confirmed),
          formatValue(r.registered)
        ]),
        [
          "รวม",
          totalRow.major,
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
        fontSize: 8,
      },
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: [0, 0, 0],
        fontStyle: "normal",
        font: fontBase64 ? "Sarabun-Light" : "helvetica",
      },
    });

    // Add yearly summary
    const startY = pdfDoc.lastAutoTable ? pdfDoc.lastAutoTable.finalY + 10 : 70;
    
    autoTable(pdfDoc, {
      startY,
      head: [["สรุปรายปี", "จำนวนรับ", "ผู้สมัคร", "มีสิทธิ์สัมภาษณ์", "เข้าสัมภาษณ์", "ผ่านการคัดเลือก", "ยืนยันสิทธิ์", "รายงานตัว"]],
      body: yearlyTotals.map(t => [
        t.year,
        formatValue(t.quota),
        formatValue(t.applicants),
        formatValue(t.interview_eligible),
        formatValue(t.interview_attended),
        formatValue(t.qualified),
        formatValue(t.confirmed),
        formatValue(t.registered)
      ]),
      theme: "grid",
      styles: {
        font: fontBase64 ? "Sarabun-Light" : "helvetica",
        fontSize: 8,
      },
      headStyles: {
        fillColor: [200, 230, 200],
        textColor: [0, 0, 0],
      },
    });

    const filename = `cosci_${table}_${years.join('-')}_${major === "all" ? "all" : major.substring(0, 20)}.pdf`;
    pdfDoc.save(filename);
  };

  const exportPDF = async () => {
    const doc = new jsPDF({ orientation: "landscape" }) as JsPDFWithAutoTable;
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
        <div>
          <h2 className="text-xl font-semibold">Table {table.toUpperCase().replace('_', ' ')}</h2>
          <p className="text-sm text-muted-foreground">
            Years: {years.join(", ")} | Major: {major === "all" ? "All" : major}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={exportPDF} 
            variant="outline" 
            size="sm"
            className="gap-2 hover:bg-blue-300"
            disabled={!fontBase64 || rows.length === 0}
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
              <TableHead>ปี</TableHead>
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
              <TableRow key={`${item.id}-${item.year}`} className="odd:bg-muted/50">
                <TableCell className="font-medium">{item.year}</TableCell>
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
              <TableCell colSpan={2}>{formatValue(totalRow.major)}</TableCell>
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

      {/* Yearly Summary Table */}
      {years.length > 1 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">สรุปรายปี</h3>
          <div className="w-full border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-green-100 text-center">
                  <TableHead>ปี</TableHead>
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
                {yearlyTotals.map((yearly, index) => (
                  <TableRow key={yearly.year} className={index % 2 === 0 ? "bg-muted/30" : ""}>
                    <TableCell className="font-medium">{yearly.year}</TableCell>
                    <TableCell>{formatValue(yearly.quota)}</TableCell>
                    <TableCell>{formatValue(yearly.applicants)}</TableCell>
                    <TableCell>{formatValue(yearly.interview_eligible)}</TableCell>
                    <TableCell>{formatValue(yearly.interview_attended)}</TableCell>
                    <TableCell>{formatValue(yearly.qualified)}</TableCell>
                    <TableCell>{formatValue(yearly.confirmed)}</TableCell>
                    <TableCell>{formatValue(yearly.registered)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}