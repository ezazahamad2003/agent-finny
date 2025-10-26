"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const workspace_id = sp.get("workspace_id") || "eff079c8-5bf9-4a45-8142-2b4d009e1eb4";
  
  const links = [
    { href: `/dashboard?workspace_id=${workspace_id}`, label: "Overview", basePath: "/dashboard" },
    { href: `/forecast?workspace_id=${workspace_id}`, label: "Revenue Forecast", basePath: "/forecast" },
    { href: `/burn?workspace_id=${workspace_id}`, label: "Burn Rate", basePath: "/burn" },
    { href: `/accounting?workspace_id=${workspace_id}`, label: "Accounting", basePath: "/accounting" },
    { href: `/tasks?workspace_id=${workspace_id}`, label: "Tasks", basePath: "/tasks" },
  ];
  
  const isActive = (basePath: string) => pathname?.startsWith(basePath);
  
  return (
    <nav className="bg-[#0f0f0f] border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
            <Image 
              src="/logo.png" 
              alt="FINNY Logo" 
              width={32}
              height={32}
              className="object-contain"
            />
            <span>FINNY</span>
          </Link>
          <div className="flex gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  isActive(link.basePath)
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

