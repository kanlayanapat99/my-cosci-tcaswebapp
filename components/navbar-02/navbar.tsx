'use client';

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/navbar-02/logo";
import { NavMenu } from "@/components/navbar-02/nav-menu";
import { NavigationSheet } from "@/components/navbar-02/navigation-sheet";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // ตรวจสอบสถานะการล็อกอิน
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(true);
          setUser(data.user);
        } else {
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [pathname]);

  return (
    <nav className="h-16 bg-black border-b">
      <div className="h-full flex items-center justify-between max-w-(--breakpoint-xl) mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>

          {/* Desktop Menu */}
          <NavMenu className="hidden md:block" />
        </div>

        <div className="flex items-center gap-3">
          {!loading && (
            <>
              {isLoggedIn ? (
                <>
                  {/* Desktop: แสดง Admin Page และ Edit Profile ข้างๆ กัน */}
                  <div className="hidden sm:flex items-center gap-3">
                    <Link href="/admin">
                      <Button variant="outline">
                        Admin Page
                      </Button>
                    </Link>
                    <Link href="/admin/edit">
                      <Button variant="outline">
                        Edit Profile
                      </Button>
                    </Link>
                  </div>
                  
                  {/* Mobile: แสดงทั้งสองปุ่มในแนวนอน */}
                  <div className="sm:hidden flex items-center gap-2">
                    <Link href="/admin">
                      <Button variant="outline" size="sm">
                        Admin
                      </Button>
                    </Link>
                    <Link href="/admin/edit">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <NavigationSheet />
                  </div>
                </>
              ) : (
                <>
                  {/* ถ้ายังไม่ได้ล็อกอิน */}
                  <div className="hidden sm:block">
                    <Link href="/admin">
                      <Button variant="outline">
                        Admin Page
                      </Button>
                    </Link>
                  </div>
                  
                  {/* Mobile */}
                  <div className="sm:hidden flex items-center gap-2">
                    <Link href="/admin">
                      <Button variant="outline" size="sm">
                        Admin
                      </Button>
                    </Link>
                    <NavigationSheet />
                  </div>
                </>
              )}
            </>
          )}

          {/* Loading State - Desktop */}
          {loading && (
            <div className="hidden sm:block">
              <Button variant="outline" disabled>
                Loading...
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;