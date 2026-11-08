// app/api/tcas/schools/route.js
// GET /api/tcas/schools            -> ทุกรอบ
// GET /api/tcas/schools?round=1    -> เฉพาะ TCAS รอบ 1 (1-4)
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const roundParam = searchParams.get("round");
    let round = null;
    if (roundParam) {
      if (!/^[1-4]$/.test(roundParam)) {
        return NextResponse.json({ error: "Invalid round" }, { status: 400 });
      }
      round = Number(roundParam);
    }
    const where = round ? "WHERE s.round = ?" : "";
    const args = round ? [round] : [];

    const [majors] = await db.query(
      "SELECT code, name FROM tcas_majors ORDER BY sort_order"
    );
    const [sources] = await db.query(
      `SELECT s.id, s.round, s.year, s.label FROM tcas_school_sources s ${where} ORDER BY s.round, s.year DESC, s.label`,
      args
    );
    const [applicants] = await db.query(
      `SELECT s.id AS source_id, s.round, s.year, sc.name, a.applicants
         FROM tcas_school_applicants a
         JOIN tcas_school_sources s ON s.id = a.source_id
         JOIN tcas_schools sc ON sc.id = a.school_id
         ${where}`,
      args
    );
    const [ranks] = await db.query(
      `SELECT s.id AS source_id, s.round, r.major_code, sc.name, r.rank_order
         FROM tcas_school_major_rank r
         JOIN tcas_school_sources s ON s.id = r.source_id
         JOIN tcas_schools sc ON sc.id = r.school_id
         ${where}
         ORDER BY r.major_code, r.rank_order`,
      args
    );

    return NextResponse.json({ majors, sources, applicants, ranks });
  } catch (err) {
    console.error("schools API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
