import { db } from "@/lib/db";
import { NextResponse } from 'next/server';

export async function GET(req, context) {
  try {
    const { params } = context;
    const { table } = await params;
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    
    // Validate table name to prevent SQL injection
    if (!/^tcas_[1-4]$/.test(table)) {
      return NextResponse.json(
        { error: "Invalid table name" },
        { status: 400 }
      );
    }
    
    let query = `SELECT * FROM ${table} WHERE 1=1`;
    const paramsArray = [];

    if (year) {
      query += " AND year = ?";
      paramsArray.push(year);
    }

    const [rows] = await db.query(query, paramsArray);
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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
      qualified,
      confirmed,
      registered,
    } = body;

    // Validate table name
    if (!/^tcas_[1-4]$/.test(table)) {
      return NextResponse.json(
        { error: "Invalid table name" },
        { status: 400 }
      );
    }

    // Update row
    await db.query(
      `UPDATE ${table}
       SET year = ?, major = ?, quota = ?, applicants = ?, qualified = ?, confirmed = ?, registered = ?
       WHERE id = ?`,
      [
        year,
        major,
        quota,
        applicants,
        qualified,
        confirmed,
        registered,
        id
      ]
    );

    return NextResponse.json({ status: "updated", id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}