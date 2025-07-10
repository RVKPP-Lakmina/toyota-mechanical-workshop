"use client"

import { useEffect, useState } from "react"
import type { Part, Customer, Bill } from "@/lib/database"

// Custom hook for reactive parts data
export function useLiveParts() {
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadParts = async () => {
      try {
        const response = await fetch("/api/parts")
        if (!response.ok) throw new Error("Failed to fetch parts")
        const data = await response.json()

        if (mounted) {
          setParts(data)
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

    // Poll for changes every 5 seconds when component is active
    const interval = setInterval(loadParts, 5000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return { parts, loading, refresh: () => setLoading(true) }
}

export function useLiveCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadCustomers = async () => {
      try {
        const response = await fetch("/api/customers")
        if (!response.ok) throw new Error("Failed to fetch customers")
        const data = await response.json()

        if (mounted) {
          setCustomers(data)
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

    // Poll for changes every 5 seconds when component is active
    const interval = setInterval(loadCustomers, 5000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return { customers, loading, refresh: () => setLoading(true) }
}

export function useLiveBills() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadBills = async () => {
      try {
        const response = await fetch("/api/bills")
        if (!response.ok) throw new Error("Failed to fetch bills")
        const data = await response.json()

        if (mounted) {
          setBills(data)
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

    // Poll for changes every 5 seconds when component is active
    const interval = setInterval(loadBills, 5000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return { bills, loading, refresh: () => setLoading(true) }
}

export function useLiveStockAlerts() {
  const [lowStock, setLowStock] = useState<Part[]>([])
  const [outOfStock, setOutOfStock] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadAlerts = async () => {
      try {
        const response = await fetch("/api/stock-alerts")
        if (!response.ok) throw new Error("Failed to fetch stock alerts")
        const data = await response.json()

        if (mounted) {
          setLowStock(data.lowStock || [])
          setOutOfStock(data.outOfStock || [])
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

    // Poll for changes every 6 seconds for alerts
    const interval = setInterval(loadAlerts, 6000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return { lowStock, outOfStock, loading }
}
