import { Button } from "@/components/ui/button";
import { Logo } from "@/components/navbar-02/logo";
import { NavMenu } from "@/components/navbar-02/nav-menu";
import { NavigationSheet } from "@/components/navbar-02/navigation-sheet";
import Link from "next/link";

const Navbar = () => {
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
          <Link href="/admin">
          <Button variant="outline" className="hidden sm:inline-flex">
            Admin
          </Button>
          </Link>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <NavigationSheet />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
