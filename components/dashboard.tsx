"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Package, Users, FileText, TrendingDown } from "lucide-react"
import { useApp } from "@/components/providers"
import { useLiveCustomers, useLiveBills, useLiveStockAlerts, useLiveParts } from "@/hooks/use-live-data"
import Link from "next/link"

export default function Dashboard() {
  const { isReady, company } = useApp()
  const { parts } = useLiveParts()
  const { customers } = useLiveCustomers()
  const { bills } = useLiveBills()
  const { lowStock, outOfStock } = useLiveStockAlerts()

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const recentBills = bills.filter((b) => b.type === "bill").length
  const recentQuotations = bills.filter((b) => b.type === "quotation").length
  const recentActivity = bills.slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to {company?.name || "Workshop Manager"}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Parts</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parts.length}</div>
            <p className="text-xs text-muted-foreground">Active parts in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{lowStock.length}</div>
            <p className="text-xs text-muted-foreground">Parts below minimum quantity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{outOfStock.length}</div>
            <p className="text-xs text-muted-foreground">Parts with zero quantity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">Total registered customers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Stock Alerts
            </CardTitle>
            <CardDescription>Parts that need attention</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 && outOfStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">All parts are well stocked!</p>
            ) : (
              <div className="space-y-3">
                {[...outOfStock, ...lowStock].slice(0, 5).map((part) => (
                  <div key={part.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{part.partName}</p>
                      <p className="text-sm text-muted-foreground">{part.partCode}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={part.quantity === 0 ? "destructive" : "secondary"}>
                        {part.quantity} / {part.minQuantity}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Link href="/parts" className="text-sm text-primary hover:underline block mt-2">
                  View all parts →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest bills and quotations</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{bill.customerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {bill.type === "bill" ? "Bill" : "Quotation"} • {new Date(bill.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{Number.parseFloat(bill.total).toFixed(2)}</p>
                      <Badge variant={bill.type === "bill" ? "default" : "secondary"}>{bill.status}</Badge>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <Link href="/bills" className="text-sm text-primary hover:underline">
                    View bills →
                  </Link>
                  <Link href="/quotations" className="text-sm text-primary hover:underline">
                    View quotations →
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
