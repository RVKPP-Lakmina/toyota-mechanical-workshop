"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { type Company, companyService } from "@/lib/database"

interface AppContextType {
  isReady: boolean
  company: Company | null
  companyId: string | null
  refreshCompany: () => Promise<void>
}

const AppContext = createContext<AppContextType>({
  isReady: false,
  company: null,
  companyId: null,
  refreshCompany: async () => {},
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const [company, setCompany] = useState<Company | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)

  const refreshCompany = async () => {
    try {
      const companyData = await companyService.get()
      setCompany(companyData)
      if (companyData) {
        setCompanyId(companyData.id)
      }
    } catch (error) {
      console.error("Failed to load company:", error)
    }
  }

  useEffect(() => {
    const initApp = async () => {
      try {
        await refreshCompany()
        setIsReady(true)
      } catch (error) {
        console.error("Failed to initialize app:", error)
        setIsReady(true) // Still set ready to show error state
      }
    }

    initApp()
  }, [])

  return (
    <AppContext.Provider value={{ isReady, company, companyId, refreshCompany }}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
