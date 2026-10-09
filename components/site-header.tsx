"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TrendingUp,
  Home,
  Compass,
  LayoutDashboard,
  Info,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Discover" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/about", label: "About" },
];

function BrandMark() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="brand-gradient flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-soft">
        <TrendingUp className="h-5 w-5" />
      </span>
      <span className="text-xl font-bold tracking-tight brand-text-gradient">
        FlowFund
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const session = useSession()?.data;
  const firstName = session?.user?.name?.split(" ")[0] || "User";
  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  const accountMenu = session?.user ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9 ring-2 ring-primary/20">
            <AvatarImage
              src={session.user.image || undefined}
              alt={session.user.name || undefined}
            />
            <AvatarFallback className="bg-primary-100 text-primary-700">
              {firstName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="px-2 py-1.5 text-sm">
          <p className="font-medium">{session.user.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {session.user.email}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">Dashboard</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/api/auth/signout">Log out</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 w-full border-b glass md:hidden">
        <div className="container flex items-center justify-between py-3">
          <BrandMark />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {accountMenu ?? (
              <Link href="/signup">
                <Button size="sm" variant="gradient">
                  Sign Up
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Desktop header */}
      <header className="sticky top-0 z-40 hidden w-full border-b glass md:block">
        <div className="container flex h-16 items-center justify-between">
          <BrandMark />
          <nav className="flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "text-primary-700 dark:text-primary-300"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "absolute inset-x-3 -bottom-px h-0.5 origin-left rounded-full bg-primary-600 transition-transform duration-300",
                    isActive(item.href) ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {session?.user ? (
              <>
                <Link href="/events/create">
                  <Button size="sm" variant="gradient" className="gap-1.5">
                    <Plus className="h-4 w-4" /> Start
                  </Button>
                </Link>
                {accountMenu}
              </>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" variant="gradient">
                    Start a fundraiser
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t glass md:hidden">
        <div className="container flex justify-around py-2">
          {[
            { href: "/", label: "Home", icon: Home },
            { href: "/events", label: "Discover", icon: Compass },
            { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { href: "/about", label: "About", icon: Info },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center rounded-lg p-2 transition-colors",
                isActive(href) ? "text-primary-600" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="mt-1 text-[11px]">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
