import { NextResponse } from 'next/server';
import { db } from "@/lib/db";

export async function POST(req) {
  try {
    const body = await req.json();
    const { round, year } = body;

    if (!round || !year) {
      return NextResponse.json(
        { error: "ต้องระบุ round และ year" },
        { status: 400 }
      );
    }

    const table = `tcas_${round}`;

    // 1. เช็คว่าปีนี้มีข้อมูลอยู่แล้วหรือยัง
    const [existing] = await db.query(
      `SELECT 1 FROM ${table} WHERE year = ? LIMIT 1`,
      [year]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { error: `ตาราง ${table} ปี ${year} มีข้อมูลอยู่แล้ว` },
        { status: 400 }
      );
    }

    // 2. กำหนดรายชื่อ major และ majorCode
    const majors = [
      "วิชาเอกการผลิตเพื่องานภาพยนตร์และสื่อดิจิทัล",
      "วิชาเอกการแสดงและกำกับการแสดงภาพยนตร์",
      "วิชาเอกการออกแบบเพื่องานภาพยนตร์และสื่อดิจิทัล",
      "วิชาเอกการจัดการภาพยนตร์และสื่อดิจิทัล",
      "วิชาเอกการออกแบบสื่อปฏิสัมพันธ์และมัลติมีเดีย",
      "วิชาเอกการจัดการธุรกิจไซเบอร์",
      "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร",
      "วิชาเอกการสื่อสารเพื่อการท่องเที่ยว",
      "วิชาเอกการสื่อสารเพื่อสุขภาพ",
      "วิชาเอกการสื่อสารเพื่อการจัดการนวัตกรรม",
      "วิชาเอกการสื่อสารเพื่อเศรษฐศาสตร์",
      "วิชาเอกการสื่อสารเพื่อการเกษตร"
    ];

    const majorCodes = [
      "C01","C02","C03","C04","I01","I02","I03","M01","M02","M03","M04","M05"
    ];

    // 3. สร้าง 12 แถว
    const inserts = [];
    for (let i = 0; i < majors.length; i++) {
      const major = majors[i];
      const majorCode = majorCodes[i];

      const [rows] = await db.query(
        `SELECT id FROM ${table} WHERE id LIKE ? ORDER BY id DESC LIMIT 1`,
        [`${majorCode}%`]
      );

      let newNumber = 1;
      if (rows.length > 0) {
        const lastId = rows[0].id;
        const numberPart = lastId.replace(majorCode, "");
        const lastNum = parseInt(numberPart) || 0;
        newNumber = lastNum + 1;
      }

      const newId = `${majorCode}${newNumber}`;
      inserts.push([newId, year, major, null, null, null, null, null, null, null]);
    }

    // 4. Insert ลง database
    await db.query(
      `INSERT INTO ${table} (id, year, major, quota, applicants, interview_eligible, interview_attended, qualified, confirmed, registered) VALUES ?`,
      [inserts]
    );

    return NextResponse.json({ 
      success: true, 
      inserted: inserts.length,
      table: table,
      year: year
    });
  } catch (err) {
    console.error('Error creating table:', err);
    return NextResponse.json({ 
      error: err.message 
    }, { status: 500 });
  }
}