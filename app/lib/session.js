// app/lib/session.js
'use server';

import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const SESSION_COOKIE_NAME = 'admin-session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 วัน

// ฟังก์ชันสำหรับ login
export async function login(username, password) {
  const { db } = await import('@/lib/db');
  
  try {
    // ดึงข้อมูลผู้ใช้จากฐานข้อมูล
    const [rows] = await db.query(
      'SELECT * FROM admin_accounts WHERE username = ?',
      [username]
    );
    
    if (rows.length === 0) {
      return { success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
    }
    
    const user = rows[0];
    
    // ตรวจสอบรหัสผ่าน
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return { success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
    }
    
    // สร้าง session
    const sessionData = {
      userId: user.id,
      username: user.username,
      timestamp: Date.now()
    };
    
    // เก็บ session ใน cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: SESSION_COOKIE_NAME,
      value: JSON.stringify(sessionData),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });
    
    return { 
      success: true, 
      user: {
        id: user.id,
        username: user.username,
        name: user.name || user.username
      }
    };
    
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการล็อกอิน' };
  }
}

// ฟังก์ชันสำหรับ logout
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// ฟังก์ชันสำหรับตรวจสอบ session
export async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  
  if (!sessionCookie?.value) {
    return null;
  }
  
  try {
    const sessionData = JSON.parse(sessionCookie.value);
    
    // ตรวจสอบว่า session ยังไม่หมดอายุ
    const sessionAge = Date.now() - sessionData.timestamp;
    if (sessionAge > SESSION_MAX_AGE * 1000) {
      await logout();
      return null;
    }
    
    return sessionData;
  } catch (error) {
    console.error('Session parse error:', error);
    await logout();
    return null;
  }
}

// ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้ปัจจุบัน
export async function getCurrentUser() {
  const session = await getSession();
  
  if (!session) {
    return null;
  }
  
  const { db } = await import('@/lib/db');
  
  try {
    const [rows] = await db.query(
      'SELECT id, username, name, created_at FROM admin_accounts WHERE id = ?',
      [session.userId]
    );
    
    if (rows.length === 0) {
      await logout();
      return null;
    }
    
    return rows[0];
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

// ฟังก์ชันสำหรับเปลี่ยนรหัสผ่าน
export async function changePassword(userId, currentPassword, newPassword) {
  const { db } = await import('@/lib/db');
  
  try {
    // ดึงข้อมูลผู้ใช้
    const [users] = await db.query(
      'SELECT * FROM admin_accounts WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return { success: false, error: 'ไม่พบผู้ใช้' };
    }
    
    const user = users[0];
    
    // ตรวจสอบรหัสผ่านปัจจุบัน
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return { success: false, error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' };
    }
    
    // Hash รหัสผ่านใหม่
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // อัพเดตรหัสผ่าน
    await db.query(
      'UPDATE admin_accounts SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, userId]
    );
    
    return { success: true, message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' };
    
  } catch (error) {
    console.error('Change password error:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' };
  }
}