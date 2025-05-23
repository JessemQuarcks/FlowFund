"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { TrendingUp, Home, Compass, LayoutDashboard, Info, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function SiteHeader() {
  const pathname = usePathname()
  const data = useSession()
  const session = data?.data
  
  console.log("data:", data)

  const isActive = (path: string) => {
    return pathname === path
  }

  // Extract first name from the user's name
  const firstName = session?.user?.name?.split(' ')[0] || 'User'

  return (
    <>
      {/* Mobile Top Logo - Hidden on homepage */}
      <div className={`md:hidden w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b ${pathname === '/' ? 'hidden' : ''}`}>
        <div className="container py-3 flex justify-center">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary-600" />
            <span className="text-xl font-bold green-text-gradient">FundFlow</span>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 hidden md:block">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary-600" />
            <span className="text-xl font-bold green-text-gradient">FundFlow</span>
          </div>
          <nav className="flex gap-6">
            <Link href="/" className={`text-sm font-medium ${isActive("/") ? "text-primary-600" : "text-muted-foreground"}`}>
              Home
            </Link>
            <Link href="/events" className={`text-sm font-medium ${isActive("/events") ? "text-primary-600" : "text-muted-foreground"}`}>
              Discover
            </Link>
            <Link href="/dashboard" className={`text-sm font-medium ${isActive("/dashboard") ? "text-primary-600" : "text-muted-foreground"}`}>
              Dashboard
            </Link>
            <Link href="/about" className={`text-sm font-medium ${isActive("/about") ? "text-primary-600" : "text-muted-foreground"}`}>
              About
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user.image || undefined} alt={session.user.name || undefined} />
                      <AvatarFallback>
                        {firstName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/api/auth/signout">Log out</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" variant="gradient">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <div className="container flex justify-around py-2">
          <Link href="/" className={`flex flex-col items-center p-2 ${isActive("/") ? "text-primary-600" : "text-muted-foreground"}`}>
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link href="/events" className={`flex flex-col items-center p-2 ${isActive("/events") ? "text-primary-600" : "text-muted-foreground"}`}>
            <Compass className="h-5 w-5" />
            <span className="text-xs mt-1">Discover</span>
          </Link>
          <Link href="/dashboard" className={`flex flex-col items-center p-2 ${isActive("/dashboard") ? "text-primary-600" : "text-muted-foreground"}`}>
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-xs mt-1">Dashboard</span>
          </Link>
          <Link href="/about" className={`flex flex-col items-center p-2 ${isActive("/about") ? "text-primary-600" : "text-muted-foreground"}`}>
            <Info className="h-5 w-5" />
            <span className="text-xs mt-1">About</span>
          </Link>
        </div>
      </nav>
    </>
  )
}