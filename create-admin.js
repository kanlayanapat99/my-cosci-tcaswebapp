import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

async function createAdmin() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root', 
      password: '',
      database: 'TCASCosci_final'
    });

    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ');

    // 1. ลองดูลบัญชีที่มีอยู่ในตาราง
    console.log('📋 ตรวจสอบบัญชีที่มีอยู่ในระบบ:');
    const [allAccounts] = await connection.execute(
      'SELECT id, username FROM admin_accounts'
    );
    
    if (allAccounts.length === 0) {
      console.log('ℹ️  ไม่มีบัญชีใดในระบบ');
    } else {
      console.log(`📊 พบบัญชีทั้งหมด ${allAccounts.length} บัญชี:`);
      allAccounts.forEach(account => {
        console.log(`   👤 ID: ${account.id}, Username: ${account.username} || '(ไม่มีชื่อ)'}`);
      });
    }

    // 2. ข้อมูลบัญชีใหม่ที่ต้องการสร้าง
    const adminAccounts = [
      {
        username: 'admin2',  // ← เปลี่ยนเป็นชื่อใหม่ที่ไม่ซ้ำ
        password: 'admin123',
      },
    ];

    console.log('\n🔄 กำลังพยายามสร้างบัญชีใหม่...');
    for (const account of adminAccounts) {
      try {
        // ตรวจสอบว่ามีบัญชีนี้อยู่แล้วหรือไม่
        const [existing] = await connection.execute(
          'SELECT id FROM admin_accounts WHERE username = ?',
          [account.username]
        );

        if (existing.length > 0) {
          console.log(`❌ ข้าม: บัญชี "${account.username}" มีอยู่แล้วในระบบ`);
          
          // แสดงข้อมูลบัญชีที่มีอยู่
          const [userInfo] = await connection.execute(
            'SELECT id, username, name, created_at FROM admin_accounts WHERE username = ?',
            [account.username]
          );
          console.log(`   📅 สร้างเมื่อ: ${userInfo[0].created_at}`);
        } else {
          // Hash รหัสผ่าน
          const hashedPassword = await bcrypt.hash(account.password, 10);
          
          // สร้างบัญชีใหม่
          await connection.execute(
            'INSERT INTO admin_accounts (username, password) VALUES (?, ?)',
            [account.username, hashedPassword]
          );
          
          console.log(`✅ สร้างบัญชี "${account.username}" สำเร็จ!`);
          console.log(`   👤 ชื่อผู้ใช้: ${account.username}`);
          console.log(`   🔑 รหัสผ่าน: ${account.password}`);
          console.log('---');
        }
      } catch (error) {
        console.error(`⚠️  เกิดข้อผิดพลาดกับบัญชี ${account.username}:`, error.message);
      }
    }

    await connection.end();
    console.log('\n🎉 การดำเนินการเสร็จสิ้น!');
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ:', error.message);
  }
}

createAdmin();