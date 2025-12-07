import { db } from "@/lib/db";
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const tables = ['tcas_1', 'tcas_2', 'tcas_3', 'tcas_4'];
    let allYears = [];

    // ดึงปีจากทุกตาราง
    for (const table of tables) {
      try {
        const [rows] = await db.query(
          `SELECT DISTINCT year FROM ${table}`
        );
        const years = rows.map(row => row.year);
        allYears = [...allYears, ...years];
      } catch (err) {
        console.error(`Error fetching years from ${table}:`, err);
      }
    }

    // ลบค่าซ้ำและเรียงลำดับ
    const uniqueYears = [...new Set(allYears)].sort((a, b) => b - a);
    
    return NextResponse.json(uniqueYears.map(year => ({ year })));
  } catch (err) {
    console.error('Error fetching all years:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}