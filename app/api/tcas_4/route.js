import { db } from "@/lib/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");

  let query = "SELECT * FROM tcas_4 WHERE 1=1";
  const params = [];

  if (year) {
    query += " AND year = ?";
    params.push(year);
  }

  try {
    const [rows] = await db.query(query, params);
    return Response.json(rows);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
