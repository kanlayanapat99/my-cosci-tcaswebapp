// middleware.js
import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'admin-session';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // ตรวจสอบ session cookie จาก request
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  
  if (!sessionCookie?.value) {
    // ถ้าไม่มี session ให้ redirect ไปหน้า login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  try {
    // พยายาม parse session data
    const sessionData = JSON.parse(sessionCookie.value);
    
    // ตรวจสอบว่า session ยังไม่หมดอายุ (7 วัน)
    const sessionAge = Date.now() - (sessionData.timestamp || 0);
    const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 วันใน milliseconds
    
    if (sessionAge > SESSION_MAX_AGE) {
      // ถ้า session หมดอายุแล้ว ให้ลบ cookie และ redirect
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }
    
    // Session ยังใช้ได้
    return NextResponse.next();
    
  } catch (error) {
    console.error('Session parse error:', error);
    
    // ถ้า parse ไม่ได้ ให้ลบ cookie ที่เสียและ redirect
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
}

// กำหนด routes ที่ต้องการให้ middleware ทำงาน
export const config = {
  matcher: [
    '/admin/:path*',          // ทุก route ใต้ /admin
    '/admin'
  ],
};