import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request, context) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    
    // ต้องใช้ await เพื่อดึง params
    const { table } = await context.params;

    // Validate table name
    if (!/^tcas_[1-4]$/.test(table)) {
      return NextResponse.json(
        { error: 'Invalid table name' },
        { status: 400 }
      );
    }

    if (!year) {
      return NextResponse.json(
        { error: 'Year is required' },
        { status: 400 }
      );
    }

    // ดึงข้อมูลสรุปจากตาราง
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total_rows,
        SUM(COALESCE(applicants, 0)) as total_applicants,
        SUM(COALESCE(qualified, 0)) as total_qualified,
        SUM(COALESCE(registered, 0)) as total_registered
       FROM ${table}
       WHERE year = ?`,
      [year]
    );

    const summary = rows[0];
    
    // คำนวณอัตราการลงทะเบียน
    const registrationRate = summary.total_applicants > 0 
      ? Math.round((summary.total_registered / summary.total_applicants) * 100)
      : 0;

    // ดึงสาขายอดนิยม 5 อันดับแรก
    const [topDepts] = await db.query(
      `SELECT 
        major as name,
        COALESCE(applicants, 0) as applicants,
        COALESCE(registered, 0) as registered
       FROM ${table}
       WHERE year = ?
       ORDER BY applicants DESC
       LIMIT 5`,
      [year]
    );

    return NextResponse.json({
      table,
      year,
      total_applicants: summary.total_applicants || 0,
      total_qualified: summary.total_qualified || 0,
      total_registered: summary.total_registered || 0,
      registration_rate: registrationRate,
      top_departments: topDepts
    });

  } catch (error) {
    console.error('Error fetching summary data:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}