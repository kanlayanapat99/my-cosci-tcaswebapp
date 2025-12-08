// app/admin/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/customized/alert/alert';
import Link from 'next/link';

type User = {
  id: number;
  username: string;
  name?: string;
  created_at?: string;
};

export default function EditAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    checkAuthAndFetchUser();
  }, []);

  const checkAuthAndFetchUser = async () => {
    try {
      // ตรวจสอบการล็อกอิน
      const authResponse = await fetch('/api/auth/check');
      if (!authResponse.ok) {
        setAuthError('กรุณาล็อกอินก่อนเข้าถึงหน้านี้');
        setLoading(false);
        return;
      }

      // ดึงข้อมูลผู้ใช้
      const userResponse = await fetch('/api/auth/me');
      if (userResponse.ok) {
        const data = await userResponse.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setAuthError('เกิดข้อผิดพลาดในการตรวจสอบการล็อกอิน');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (message) setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ตรวจสอบความถูกต้อง
    if (!formData.currentPassword) {
      setMessage({ type: 'error', text: 'กรุณากรอกรหัสผ่านปัจจุบัน' });
      return;
    }
    
    if (!formData.newPassword) {
      setMessage({ type: 'error', text: 'กรุณากรอกรหัสผ่านใหม่' });
      return;
    }
    
    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน' });
      return;
    }
    
    setUpdating(true);
    
    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      }
      
      setMessage({
        type: 'success',
        text: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว'
      });
      
      // ล้างฟอร์ม
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
    } catch (error) {
      console.error('Error updating password:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const goToLogin = () => {
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <div className="text-gray-500">กำลังตรวจสอบการล็อกอิน...</div>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2 mb-4">
                <ArrowLeft className="h-4 w-4" />
                กลับสู่หน้าหลัก
              </Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">เปลี่ยนรหัสผ่าน Admin</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">ไม่สามารถเข้าถึงหน้านี้ได้</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
              
              <div className="flex gap-3">
                <Button onClick={goToLogin} className="flex-1">
                  ไปยังหน้าล็อกอิน
                </Button>
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full">
                    กลับสู่หน้าหลัก
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  กลับ
                </Button>
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">เปลี่ยนรหัสผ่าน Admin</h1>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              ออกจากระบบ
            </Button>
          </div>
          <p className="text-gray-600">จัดการรหัสผ่านของคุณ</p>
        </div>

        {/* User Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">ข้อมูลผู้ใช้</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-500">ชื่อผู้ใช้</Label>
                <div className="font-medium text-gray-900">{user?.username}</div>
              </div>
              {user?.name && (
                <div>
                  <Label className="text-sm text-gray-500">ชื่อ</Label>
                  <div className="font-medium text-gray-900">{user.name}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Change Password Form */}
        <Card>
          <CardHeader>
            <CardTitle>เปลี่ยนรหัสผ่าน</CardTitle>
            <CardDescription>
              กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">รหัสผ่านปัจจุบัน</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  placeholder="กรอกรหัสผ่านปัจจุบัน"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  required
                  disabled={updating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">รหัสผ่านใหม่</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  disabled={updating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={updating}
                />
              </div>

              {message && (
                <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                  {message.type === 'error' ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full md:w-auto" 
                disabled={updating}
              >
                {updating ? 'กำลังเปลี่ยนรหัสผ่าน...' : 'เปลี่ยนรหัสผ่าน'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}