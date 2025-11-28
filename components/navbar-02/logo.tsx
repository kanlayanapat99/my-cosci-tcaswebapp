import Image from "next/image";

export const Logo = () => (
  <Image 
    src="/cosciLogo.png" 
    alt="Logo"
    width={0}
    height={0}
    sizes="100vw"
    style={{ width: "150px", height: "auto" }}
    priority
  />
);