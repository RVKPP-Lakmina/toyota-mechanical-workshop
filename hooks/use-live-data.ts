"use client"

import { useEffect, useState } from "react"
import { type Part, type Customer, type Bill, partsService, customersService, billsService } from "@/lib/database"
import { useApp } from "@/components/providers"

// Custom hook for reactive parts data
export function useLiveParts() {
  const { companyId } = useApp()
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId) return

    let mounted = true

    const loadParts = async () => {
      try {
        const allParts = await partsService.getAll(companyId)
        if (mounted) {
          setParts(allParts)
          setLoading(false)
        }
      } catch (error) {
        console.error("Error loading parts:", error)
        if (mounted) {
          setParts([])
          setLoading(false)
        }
      }
    }

    loadParts()

    // Poll for changes every 3 seconds when component is active
    const interval = setInterval(loadParts, 3000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [companyId])

  return { parts, loading, refresh: () => setLoading(true) }
}

export function useLiveCustomers() {
  const { companyId } = useApp()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId) return

    let mounted = true

    const loadCustomers = async () => {
      try {
        const allCustomers = await customersService.getAll(companyId)
        if (mounted) {
          setCustomers(allCustomers)
          setLoading(false)
        }
      } catch (error) {
        console.error("Error loading customers:", error)
        if (mounted) {
          setCustomers([])
          setLoading(false)
        }
      }
    }

    loadCustomers()

    // Poll for changes every 3 seconds when component is active
    const interval = setInterval(loadCustomers, 3000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [companyId])

  return { customers, loading, refresh: () => setLoading(true) }
}

export function useLiveBills() {
  const { companyId } = useApp()
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId) return

    let mounted = true

    const loadBills = async () => {
      try {
        const allBills = await billsService.getAll(companyId)
        if (mounted) {
          setBills(allBills)
          setLoading(false)
        }
      } catch (error) {
        console.error("Error loading bills:", error)
        if (mounted) {
          setBills([])
          setLoading(false)
        }
      }
    }

    loadBills()

    // Poll for changes every 3 seconds when component is active
    const interval = setInterval(loadBills, 3000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [companyId])

  return { bills, loading, refresh: () => setLoading(true) }
}

export function useLiveStockAlerts() {
  const { companyId } = useApp()
  const [lowStock, setLowStock] = useState<Part[]>([])
  const [outOfStock, setOutOfStock] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId) return

    let mounted = true

    const loadAlerts = async () => {
      try {
        const [lowStockParts, outOfStockParts] = await Promise.all([
          partsService.getLowStock(companyId),
          partsService.getOutOfStock(companyId),
        ])

        if (mounted) {
          setLowStock(lowStockParts)
          setOutOfStock(outOfStockParts)
          setLoading(false)
        }
      } catch (error) {
        console.error("Error loading stock alerts:", error)
        if (mounted) {
          setLowStock([])
          setOutOfStock([])
          setLoading(false)
        }
      }
    }

    loadAlerts()

    // Poll for changes every 4 seconds for alerts
    const interval = setInterval(loadAlerts, 4000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [companyId])

  return { lowStock, outOfStock, loading }
}
