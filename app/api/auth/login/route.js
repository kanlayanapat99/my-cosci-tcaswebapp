// app/api/auth/login/route.js
import { login } from '@/lib/session';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ 
        error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await login(username, password);

    if (!result.success) {
      return new Response(JSON.stringify({ 
        error: result.error 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      user: result.user 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Login API error:', error);
    return new Response(JSON.stringify({ 
      error: 'เกิดข้อผิดพลาดในการล็อกอิน' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}