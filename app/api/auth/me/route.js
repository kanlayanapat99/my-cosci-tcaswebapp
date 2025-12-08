// app/api/auth/me/route.js
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const { db } = await import('@/lib/db');
    
    // ดึงข้อมูลผู้ใช้จาก database
    const [rows] = await db.query(
      'SELECT id, username, password FROM admin_accounts WHERE id = ?',
      [session.user.id]
    );
    
    if (rows.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'User not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const user = rows[0];
    
    return new Response(JSON.stringify({ 
      success: true,
      user 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}