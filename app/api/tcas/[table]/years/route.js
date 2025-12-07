import { db } from "@/lib/db";
import { NextResponse } from 'next/server';

export async function GET(request, context) {
  try {
    // ต้องใช้ await เพื่อดึง params
    const { table } = await context.params;
    
    // Validate table name
    if (!/^tcas_[1-4]$/.test(table)) {
      return NextResponse.json(
        { error: "Invalid table name" },
        { status: 400 }
      );
    }
    
    const [rows] = await db.query(
      `SELECT DISTINCT year FROM ${table} ORDER BY year DESC`
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error('Error fetching years:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}