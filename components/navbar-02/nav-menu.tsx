import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/navbar-02/navigation-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ComponentProps } from "react";

const tcasOptions = [
  { value: "tcas_1", label: "TCAS1" },
  { value: "tcas_2", label: "TCAS2" },
  { value: "tcas_3", label: "TCAS3" },
  { value: "tcas_4", label: "TCAS4" },
];

export const NavMenu = (props: ComponentProps<typeof NavigationMenu>) => {
  const pathname = usePathname();
  
  // ตรวจสอบว่า pathname ตรงกับ TCAS route ไหน
  const getIsActive = (tableValue: string) => {
    // กรณีที่เป็น dynamic route /tcas/[table]
    if (pathname.startsWith(`/tcas/${tableValue}`)) {
      return true;
    }
    
    // กรณีที่เป็น route เก่า /tcas1, /tcas2, /tcas3, /tcas4
    // ตรวจสอบชื่อ table กับ pathname
    const tableNumber = tableValue.split('_')[1]; // ได้ "1", "2", "3", "4"
    if (pathname === `/tcas${tableNumber}` || pathname.startsWith(`/tcas${tableNumber}/`)) {
      return true;
    }
    
    return false;
  };

  return (
    <NavigationMenu {...props}>
      <NavigationMenuList className="data-[orientation=vertical]:-ms-2 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-start data-[orientation=vertical]:justify-start">
        {tcasOptions.map((option) => {
          const isActive = getIsActive(option.value);
          
          // ใช้ dynamic route สำหรับลิงก์ใหม่
          const href = `/tcas/${option.value}`;
          
          return (
            <NavigationMenuItem key={option.value}>
              <NavigationMenuLink asChild>
                <Link 
                  href={href}
                  className={`${navigationMenuTriggerStyle()} ${
                    isActive ? "bg-accent text-accent-foreground" : ""
                  }`}
                >
                  {option.label}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
};