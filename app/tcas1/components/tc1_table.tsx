"use client";

import { useState, useEffect } from "react";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow, TableCaption
} from "@/components/ui/table";

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

export default function TableTCAS1({ year }: TableTCASProps) {
  const [rows, setRows] = useState<TCASRow[]>([]);

  useEffect(() => {
    const url = year ? `/api/tcas_1?year=${year}` : "/api/tcas1";

    fetch(url)
      .then(res => res.json())
      .then((data: TCASRow[]) => setRows(data));
  }, [year]);

  return (
    <Table>
      <TableCaption>สถิติการคัดเลือกเข้าเป็นนิสิตระดับปริญญาตรีประจำปีการศึกษา {year} <br />
        วิทยาลัยนวัตกรรมสื่อสารสังคม มหาวิทยาลัยศรีนครินทรวิโรฒ
      </TableCaption>

      <TableHeader>
        <TableRow>
          <TableHead>สาขา / วิชาเอก</TableHead>
          <TableHead>จำนวนรับ</TableHead>
          <TableHead>จำนวนผู้สมัคร</TableHead>
          <TableHead>มีสิทธิ์สอบสัมภาษณ์</TableHead>
          <TableHead>เข้าสอบสัมภาษณ์</TableHead>
          <TableHead>ผ่านการคัดเลือก</TableHead>
          <TableHead>ยืนยันสิทธิ์</TableHead>
          <TableHead>รายงานตัว</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {rows.map(item => {
          return (
            <TableRow key={item.id}>
              <TableCell>{item.major}</TableCell>
              <TableCell>{item.quota}</TableCell>
              <TableCell>{item.applicants}</TableCell>
              <TableCell>{item.interview_eligible}</TableCell>
              <TableCell>{item.interview_attended}</TableCell>
              <TableCell>{item.qualified}</TableCell>
              <TableCell>{item.confirmed}</TableCell>
              <TableCell>{item.registered}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
