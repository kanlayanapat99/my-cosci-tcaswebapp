import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as XLSX from "xlsx";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "กรุณาอัปโหลดไฟล์" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return NextResponse.json({ error: "ไฟล์ไม่มีข้อมูล" }, { status: 400 });
    }

    // tidy function ลบตัวแปลก + trim
    const clean = (str) =>
      String(str || "")
        .replace(/\u200B/g, "") // zero-width space
        .replace(/\t/g, "")
        .replace(/\r/g, "")
        .replace(/\n/g, "")
        .trim();

    // อ่าน round/year แบบ sanitize
    const round = clean(rows[0].round);
    const year = clean(rows[0].year);

    if (!round || !year) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูล round หรือ year ในไฟล์" },
        { status: 400 }
      );
    }

    const majorCodes = {
      "วิชาเอกการผลิตเพื่องานภาพยนตร์และสื่อดิจิทัล": "C01",
      "วิชาเอกการแสดงและกำกับการแสดงภาพยนตร์": "C02",
      "วิชาเอกการออกแบบเพื่องานภาพยนตร์และสื่อดิจิทัล": "C03",
      "วิชาเอกการจัดการภาพยนตร์และสื่อดิจิทัล": "C04",
      "วิชาเอกการออกแบบสื่อปฏิสัมพันธ์และมัลติมีเดีย": "I01",
      "วิชาเอกการจัดการธุรกิจไซเบอร์": "I02",
      "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร": "I03",
      "วิชาเอกการสื่อสารเพื่อการท่องเที่ยว": "M01",
      "วิชาเอกการสื่อสารเพื่อสุขภาพ": "M02",
      "วิชาเอกการสื่อสารเพื่อการจัดการนวัตกรรม": "M03",
      "วิชาเอกการสื่อสารเพื่อเศรษฐศาสตร์": "M04",
      "วิชาเอกการสื่อสารเพื่อการเกษตร": "M05"
    };

    let totalInserted = 0;

    for (const row of rows) {
      const round = clean(row.round);
      const year = clean(row.year);
      const table = `tcas_${round}`;

      const majorClean = clean(row.major);

      const code = majorCodes[majorClean];

      if (!code) {
        return NextResponse.json(
          {
            error: `major ไม่ตรงกับระบบ: "${row.major}" (cleaned: "${majorClean}")`
          },
          { status: 400 }
        );
      }

      // ดึง ID ล่าสุดของ major นั้น
      const [last] = await db.query(
        `SELECT id FROM ${table} WHERE id LIKE ? ORDER BY id DESC LIMIT 1`,
        [`${code}%`]
      );

      let newNumber = 1;

      if (last.length > 0) {
        const numberPart = last[0].id.replace(code, "");
        newNumber = (parseInt(numberPart) || 0) + 1;
      }

      const newId = `${code}${newNumber}`;

      await db.query(
        `INSERT INTO ${table} 
        (id, year, major, quota, applicants, interview_eligible, interview_attended, qualified, confirmed, registered)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId,
          year,
          majorClean,
          row.quota || 0,
          row.applicants || 0,
          row.interview_eligible || 0,
          row.interview_attended || 0,
          row.qualified || 0,
          row.confirmed || 0,
          row.registered || 0,
        ]
      );

      totalInserted++;
    }

    return NextResponse.json({
      success: true,
      inserted: totalInserted,
      round,
      year,
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
