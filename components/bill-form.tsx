"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Trash2, Plus } from "lucide-react"
import { billsService, type Customer } from "@/lib/database"
import { useApp } from "@/components/providers"
import { useToast } from "@/hooks/use-toast"
import { useLiveCustomers, useLiveParts } from "@/hooks/use-live-data"

interface BillFormProps {
  type: "bill" | "quotation"
}

interface BillItem {
  partId: string
  partName: string
  partCode: string
  unitPrice: string
  quantity: number
  total: number
}

export default function BillForm({ type }: BillFormProps) {
  const { isReady, companyId, company } = useApp()
  const { toast } = useToast()
  const router = useRouter()

  const { customers } = useLiveCustomers()
  const { parts } = useLiveParts()
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [billItems, setBillItems] = useState<BillItem[]>([])
  const [subtotal, setSubtotal] = useState(0)
  const [taxRate, setTaxRate] = useState(18)
  const [tax, setTax] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (company?.taxRate) {
      setTaxRate(Number.parseFloat(company.taxRate))
    }
  }, [company])

  useEffect(() => {
    calculateTotals()
  }, [billItems, taxRate])

  const calculateTotals = () => {
    const newSubtotal = billItems.reduce((sum, item) => sum + item.total, 0)
    const newTax = (newSubtotal * taxRate) / 100
    const newTotal = newSubtotal + newTax

    setSubtotal(newSubtotal)
    setTax(newTax)
    setTotal(newTotal)
  }

  const addBillItem = () => {
    setBillItems([
      ...billItems,
      {
        partId: "",
        partName: "",
        partCode: "",
        unitPrice: "0",
        quantity: 1,
        total: 0,
      },
    ])
  }

  const updateBillItem = (index: number, field: keyof BillItem, value: any) => {
    const updatedItems = [...billItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    if (field === "partId") {
      const selectedPart = parts.find((p) => p.id === value)
      if (selectedPart) {
        updatedItems[index].partName = selectedPart.partName
        updatedItems[index].partCode = selectedPart.partCode
        updatedItems[index].unitPrice = selectedPart.unitPrice
      }
    }

    if (field === "quantity" || field === "unitPrice") {
      updatedItems[index].total = updatedItems[index].quantity * Number.parseFloat(updatedItems[index].unitPrice)
    }

    setBillItems(updatedItems)
  }

  const removeBillItem = (index: number) => {
    setBillItems(billItems.filter((_, i) => i !== index))
  }

  const handleSubmit = async (status: "draft" | "completed") => {
    if (!selectedCustomer?.id || !companyId) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive",
      })
      return
    }

    if (billItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item",
        variant: "destructive",
      })
      return
    }

    try {
      const billNumber = await billsService.generateBillNumber(companyId, type)

      const billData = {
        companyId,
        customerId: selectedCustomer.id,
        billNumber,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        customerAddress: selectedCustomer.address || null,
        items: billItems.map((item) => ({
          partId: item.partId,
          partName: item.partName,
          partCode: item.partCode,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          total: item.total,
        })),
        subtotal: subtotal.toString(),
        taxRate: taxRate.toString(),
        taxAmount: tax.toString(),
        total: total.toString(),
        type,
        status,
        notes: null,
      }

      await billsService.create(billData)

      toast({
        title: "Success",
        description: `${type === "bill" ? "Bill" : "Quotation"} ${status === "draft" ? "saved as draft" : "created"} successfully`,
      })

      router.push(type === "bill" ? "/bills" : "/quotations")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to create ${type}`,
        variant: "destructive",
      })
    }
  }

  if (!isReady) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
          <CardDescription>Select the customer for this {type}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select
                onValueChange={(value) => {
                  const customer = customers.find((c) => c.id === value)
                  setSelectedCustomer(customer || null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id!}>
                      {customer.name} - {customer.phone}
                      {customer.vehicle && ` (${customer.vehicle})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCustomer && (
              <div className="p-3 bg-muted rounded-lg">
                <p>
                  <strong>Name:</strong> {selectedCustomer.name}
                </p>
                <p>
                  <strong>Phone:</strong> {selectedCustomer.phone}
                </p>
                {selectedCustomer.email && (
                  <p>
                    <strong>Email:</strong> {selectedCustomer.email}
                  </p>
                )}
                {selectedCustomer.vehicle && (
                  <p>
                    <strong>Vehicle:</strong> {selectedCustomer.vehicle}
                  </p>
                )}
                {selectedCustomer.address && (
                  <p>
                    <strong>Address:</strong> {selectedCustomer.address}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Items</CardTitle>
              <CardDescription>Add parts to this {type}</CardDescription>
            </div>
            <Button onClick={addBillItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {billItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-end p-4 border rounded-lg">
                <div className="col-span-4">
                  <Label>Part</Label>
                  <Select value={item.partId} onValueChange={(value) => updateBillItem(index, "partId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select part" />
                    </SelectTrigger>
                    <SelectContent>
                      {parts.map((part) => (
                        <SelectItem key={part.id} value={part.id!}>
                          {part.partName} - {part.partCode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateBillItem(index, "unitPrice", e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateBillItem(index, "quantity", Number.parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="col-span-3">
                  <Label>Total</Label>
                  <Input value={`₹${item.total.toFixed(2)}`} readOnly className="bg-muted" />
                </div>
                <div className="col-span-1">
                  <Button variant="outline" size="icon" onClick={() => removeBillItem(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({taxRate}%):</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <Button variant="outline" onClick={() => handleSubmit("draft")} className="flex-1">
              Save as Draft
            </Button>
            <Button onClick={() => handleSubmit("completed")} className="flex-1">
              {type === "bill" ? "Complete Bill" : "Create Quotation"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
