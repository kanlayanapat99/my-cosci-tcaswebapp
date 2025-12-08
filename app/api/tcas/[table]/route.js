// app/api/tcas/[table]/route.js
import { db } from "@/lib/db";
import { NextResponse } from 'next/server';

export async function GET(req, context) {
  try {
    const { params } = context;
    const { table } = await params;
    const { searchParams } = new URL(req.url);
    
    // Get query parameters
    const years = searchParams.get("years");
    const year = searchParams.get("year"); // สำหรับ backward compatibility
    const major = searchParams.get("major");
    
    // Validate table name
    if (!/^tcas_[1-4]$/.test(table)) {
      return NextResponse.json(
        { error: "Invalid table name" },
        { status: 400 }
      );
    }
    
    let query = `SELECT * FROM ${table} WHERE 1=1`;
    const paramsArray = [];

    // Handle multiple years OR single year
    if (years) {
      const yearArray = years.split(',').filter(y => y.trim() !== '');
      if (yearArray.length > 0) {
        query += ` AND year IN (${yearArray.map(() => '?').join(',')})`;
        paramsArray.push(...yearArray);
      }
    } else if (year) {
      query += " AND year = ?";
      paramsArray.push(year);
    }

    // Handle major filter
    if (major && major !== "all") {
      query += " AND major LIKE ?";
      paramsArray.push(`%${major}%`);
    }

    const [rows] = await db.query(query, paramsArray);
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT method remains the same
export async function PUT(req, context) {
  try {
    const { params } = context;
    const { table } = await params;
    const body = await req.json();
    const {
      id,
      year,
      major,
      quota,
      applicants,
      interview_eligible,
      interview_attended,
      qualified,
      confirmed,
      registered,
    } = body;

    if (!/^tcas_[1-4]$/.test(table)) {
      return NextResponse.json(
        { error: "Invalid table name" },
        { status: 400 }
      );
    }

    await db.query(
      `UPDATE ${table}
       SET year = ?, major = ?, quota = ?, applicants = ?, interview_eligible = ?, interview_attended = ?, qualified = ?, confirmed = ?, registered = ?
       WHERE id = ?`,
      [
        year || null,
        major || null,
        quota || null,
        applicants || null,
        interview_eligible || null,
        interview_attended || null,
        qualified || null,
        confirmed || null,
        registered || null,
        id
      ]
    );

    return NextResponse.json({ status: "updated", id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE method สำหรับลบข้อมูลตาราง
export async function DELETE(req, context) {
  try {
    const { params } = context;
    const { table } = await params;
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");

    // Validate table name
    if (!/^tcas_[1-4]$/.test(table)) {
      return NextResponse.json(
        { error: "Invalid table name" },
        { status: 400 }
      );
    }

    // ถ้าไม่มีปี ให้ลบข้อมูลทั้งหมดในตาราง
    if (!year) {
      const [result] = await db.query(`DELETE FROM ${table}`);
      const affectedRows = result?.affectedRows || 0;
      
      return NextResponse.json({ 
        status: "success", 
        message: `ลบข้อมูลทั้งหมดในตาราง ${table} สำเร็จ`,
        deletedCount: affectedRows
      });
    }

    // ลบข้อมูลเฉพาะปี
    const [result] = await db.query(
      `DELETE FROM ${table} WHERE year = ?`,
      [year]
    );

    const affectedRows = result?.affectedRows || 0;

    return NextResponse.json({ 
      status: "success", 
      message: `ลบข้อมูลตาราง ${table} ปี ${year} สำเร็จ`,
      deletedCount: affectedRows
    });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json({ 
      error: err.message || "เกิดข้อผิดพลาดในการลบข้อมูล" 
    }, { status: 500 });
  }
}