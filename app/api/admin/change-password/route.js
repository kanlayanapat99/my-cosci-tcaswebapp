// app/api/admin/change-password/route.js
import { getCurrentUser, changePassword } from '@/lib/session';

export async function POST(request) {
  try {
    // ตรวจสอบการล็อกอิน
    const user = await getCurrentUser();
    
    if (!user) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const { currentPassword, newPassword } = await request.json();
    
    if (!currentPassword || !newPassword) {
      return new Response(JSON.stringify({ 
        error: 'กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (newPassword.length < 6) {
      return new Response(JSON.stringify({ 
        error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // เปลี่ยนรหัสผ่าน
    const result = await changePassword(user.id, currentPassword, newPassword);
    
    if (!result.success) {
      return new Response(JSON.stringify({ 
        error: result.error 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: result.message 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Change password API error:', error);
    return new Response(JSON.stringify({ 
      error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}