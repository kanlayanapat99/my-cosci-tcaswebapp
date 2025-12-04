"use client";

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
import { motion } from "framer-motion";

const tcasOptions = [
  { value: "tcas_1", label: "TCAS1" },
  { value: "tcas_2", label: "TCAS2" },
  { value: "tcas_3", label: "TCAS3" },
  { value: "tcas_4", label: "TCAS4" },
];

export const NavMenu = (props: ComponentProps<typeof NavigationMenu>) => {
  const pathname = usePathname();
  
  const getIsActive = (tableValue: string) => {
    return pathname.startsWith(`/tcas/${tableValue}`);
  };

  return (
    <NavigationMenu {...props}>
      <NavigationMenuList className="data-[orientation=vertical]:-ms-2 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-start data-[orientation=vertical]:justify-start">
        {tcasOptions.map((option, index) => {
          const isActive = getIsActive(option.value);
          const href = `/tcas/${option.value}`;
          
          return (
            <NavigationMenuItem key={option.value}>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
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
              </motion.div>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
};