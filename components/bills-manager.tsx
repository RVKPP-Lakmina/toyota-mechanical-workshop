"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Eye, Receipt, Printer, Share2 } from "lucide-react"
import type { Bill } from "@/lib/database"
import { useApp } from "@/components/providers"
import { useToast } from "@/hooks/use-toast"
import { useLiveBills } from "@/hooks/use-live-data"
import { PrintTemplate } from "@/components/print-template"
import { useReactToPrint } from "react-to-print"
import Link from "next/link"

export default function BillsManager() {
  const { isReady, companyId, company } = useApp()
  const { toast } = useToast()
  const { bills: allBills, loading } = useLiveBills()
  const [bills, setBills] = useState<Bill[]>([])
  const [filteredBills, setFilteredBills] = useState<Bill[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (allBills) {
      const billsOnly = allBills.filter((bill) => bill.type === "bill")
      setBills(billsOnly)
    }
  }, [allBills])

  useEffect(() => {
    filterBills()
  }, [bills, searchTerm, statusFilter])

  const filterBills = () => {
    let filtered = bills

    if (searchTerm) {
      filtered = filtered.filter(
        (bill) =>
          bill.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((bill) => bill.status === statusFilter)
    }

    setFilteredBills(filtered)
  }

  const handleViewBill = (bill: Bill) => {
    setSelectedBill(bill)
    setIsViewDialogOpen(true)
  }

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Bill-${selectedBill?.billNumber}`,
  })

  const handleShare = async (bill: Bill) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bill ${bill.billNumber}`,
          text: `Bill for ${bill.customerName} - Total: ₹${Number.parseFloat(bill.total).toFixed(2)}`,
          url: window.location.href,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `Bill ${bill.billNumber}\nCustomer: ${bill.customerName}\nTotal: ₹${Number.parseFloat(bill.total).toFixed(2)}\nDate: ${new Date(bill.createdAt).toLocaleDateString()}`

      try {
        await navigator.clipboard.writeText(shareText)
        toast({
          title: "Copied to clipboard",
          description: "Bill details copied to clipboard",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy bill details",
          variant: "destructive",
        })
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "draft":
        return "secondary"
      case "cancelled":
        return "destructive"
      default:
        return "secondary"
    }
  }

  if (!isReady || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Receipt className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading bills...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bills Management</h1>
          <p className="text-muted-foreground">Manage customer bills and invoices</p>
        </div>

        <Link href="/bills/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Bill
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bills by customer name or bill number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bills List */}
      <div className="space-y-4">
        {filteredBills.map((bill) => (
          <Card key={bill.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Bill #{bill.billNumber}</CardTitle>
                  <CardDescription>
                    {bill.customerName} • {new Date(bill.createdAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(bill.status)}>{bill.status}</Badge>
                  <span className="text-lg font-bold">₹{Number.parseFloat(bill.total).toFixed(2)}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {Array.isArray(bill.items) ? bill.items.length : 0} item(s) • Subtotal: ₹
                  {Number.parseFloat(bill.subtotal).toFixed(2)} • Tax: ₹{Number.parseFloat(bill.taxAmount).toFixed(2)}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewBill(bill)}>
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleShare(bill)}>
                    <Share2 className="h-3 w-3 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBills.length === 0 && (
        <div className="text-center py-12">
          <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No bills found</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Create your first bill to get started"}
          </p>
        </div>
      )}

      {/* View Bill Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle>Bill #{selectedBill?.billNumber}</DialogTitle>
                <DialogDescription>Bill details for {selectedBill?.customerName}</DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" size="sm" onClick={() => selectedBill && handleShare(selectedBill)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </DialogHeader>

          {selectedBill && company && <PrintTemplate ref={printRef} bill={selectedBill} company={company} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
