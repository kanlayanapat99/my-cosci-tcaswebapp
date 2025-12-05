import { Separator } from "@/components/ui/separator";
import { Facebook, Instagram, Youtube, Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const footerLinks = [
  {
    title: "TCAS1",
    href: "/tcas/tcas_1",
  },
  {
    title: "TCAS2",
    href: "/tcas/tcas_2",
  },
  {
    title: "TCAS3",
    href: "/tcas/tcas_3",
  },
  {
    title: "TCAS4",
    href: "/tcas/tcas_4",
  }
];

const Footer = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="grow bg-muted" />
      <footer className="border-t bg-black">
        <div className="max-w-7xl mx-auto text-white">
          <div className="py-12 flex flex-col justify-start items-center">
            {/* Logo */}
            <Image 
              src="/cosciLogo.png" 
              alt="Logo"
              width={160}
              height={0}
              sizes="100vw"
              style={{ height: "auto" }}
              priority
            />
            <ul className="mt-6 flex items-center gap-4 flex-wrap">
              {footerLinks.map(({ title, href }) => (
                <li key={title}>
                  <Link
                    href={href}
                    className="text-muted-foreground hover:text-blue-500 transition-colors"
                  >
                    {title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <Separator />
          <div className="py-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-x-2 gap-y-5 px-6 xl:px-0">
            {/* Copyright */}
            <span className="text-muted-foreground">
              &copy; {new Date().getFullYear()}{" "}
              <Link href="/" className="hover:text-blue-500">
                 COSCI, Srinakharinwirot University
              </Link>
              . All rights reserved.
            </span>

            <div className="flex items-center gap-5 text-muted-foreground">
              <Link href="https://facebook.com/swu.ac.th" target="_blank" className="hover:text-blue-500">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="https://instagram.com/swupr" target="_blank" className="hover:text-pink-500">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="https://youtube.com/swupr" target="_blank" className="hover:text-red-500">
                <Youtube className="h-5 w-5" />
              </Link>
              <Link href="mailto:cosci@swu.ac.th" className="hover:text-green-500">
                <Mail className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;