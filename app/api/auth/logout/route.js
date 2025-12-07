// app/api/auth/logout/route.js
import { logout } from '@/app/lib/session';

export async function POST() {
  try {
    await logout();
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Logged out successfully' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(JSON.stringify({ 
      error: 'เกิดข้อผิดพลาดในการออกจากระบบ' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}