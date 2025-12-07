// app/api/tcas/[table]/majors/route.js
import { db } from "@/lib/db";
import { NextResponse } from 'next/server';

export async function GET(req, context) {
  try {
    const { params } = context;
    const { table } = await params;
    const { searchParams } = new URL(req.url);
    const years = searchParams.get("years");
    
    // Validate table name
    if (!/^tcas_[1-4]$/.test(table)) {
      return NextResponse.json(
        { error: "Invalid table name" },
        { status: 400 }
      );
    }
    
    let query = `SELECT DISTINCT major FROM ${table} WHERE 1=1`;
    const paramsArray = [];

    // Filter by years if provided
    if (years) {
      const yearArray = years.split(',').filter(y => y.trim() !== '');
      if (yearArray.length > 0) {
        query += ` AND year IN (${yearArray.map(() => '?').join(',')})`;
        paramsArray.push(...yearArray);
      }
    }

    query += " ORDER BY major";

    const [rows] = await db.query(query, paramsArray);
    return NextResponse.json(rows.map(row => row.major));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}