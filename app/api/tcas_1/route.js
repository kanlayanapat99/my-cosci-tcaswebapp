import { db } from "@/lib/db";

//GET Method
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  
  let query = "SELECT * FROM tcas_1 WHERE 1=1";
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


//PUT UPDATE Method
export async function PUT(req) {
  try {
    const body = await req.json();
    const {
      id,          // เช่น "C014"
      year,
      major,
      quota,
      applicants,
      qualified,
      confirmed,
      registered,
    } = body;

    // update row
    await db.query(
      `UPDATE tcas_1
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

    return Response.json({ status: "updated", id });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}