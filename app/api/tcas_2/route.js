import { db } from "@/lib/db"; 

export async function GET() { try { 
	const [rows] = await db.query("SELECT * FROM tcas_2"); 
	return Response.json(rows); 
} 
	catch (err) { return Response.json({ error: err.message }, 
    { status: 500 }); 
} }