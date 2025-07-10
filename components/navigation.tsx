"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Home, Package, Users, FileText, Receipt, Moon, Sun, Settings, Menu, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useTheme } from "next-themes"
import { useApp } from "@/components/providers"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Parts", href: "/parts", icon: Package },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Bills", href: "/bills", icon: Receipt },
  { name: "Quotations", href: "/quotations", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { company } = useApp()
  const [isOpen, setIsOpen] = useState(false)

  const NavItems = ({ mobile = false, onItemClick }: { mobile?: boolean; onItemClick?: () => void }) => (
    <>
      {navigation.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
              mobile ? "w-full px-3 py-2 rounded-md hover:bg-accent" : "",
              isActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.name}</span>
          </Link>
        )
      })}
    </>
  )

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            {company?.logoUrl ? (
              <img src={company.logoUrl || "/placeholder.svg"} alt="Logo" className="h-8 w-8 object-contain" />
            ) : (
              <Building2 className="h-6 w-6 text-primary" />
            )}
            <span className="font-bold text-lg">{company?.name || "Workshop Manager"}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <NavItems />
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                <div className="flex flex-col space-y-4 mt-6">
                  {/* Mobile Logo */}
                  <div className="flex items-center space-x-2 px-3 pb-4 border-b">
                    {company?.logoUrl ? (
                      <img src={company.logoUrl || "/placeholder.svg"} alt="Logo" className="h-8 w-8 object-contain" />
                    ) : (
                      <Building2 className="h-6 w-6 text-primary" />
                    )}
                    <span className="font-bold text-lg">{company?.name || "Workshop Manager"}</span>
                  </div>

                  {/* Mobile Navigation */}
                  <div className="flex flex-col space-y-2">
                    <NavItems mobile onItemClick={() => setIsOpen(false)} />
                  </div>

                  {/* Mobile Theme Toggle */}
                  <div className="pt-4 border-t">
                    <Button
                      variant="ghost"
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      className="w-full justify-start"
                    >
                      <Sun className="h-4 w-4 mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute h-4 w-4 ml-2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      <span className="ml-6">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
