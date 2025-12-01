import { db } from "@/lib/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const id = searchParams.get("id");

  let query = "SELECT * FROM tcas_4 WHERE 1=1";
  const params = [];

  if (year) {
    query += " AND year = ?";
    params.push(year);
  }

  if (id) {
    query += " AND id = ?";
    params.push(id);
  }

  query += " ORDER BY major";

  try {
    const [rows] = await db.query(query, params);
    return Response.json(rows);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
