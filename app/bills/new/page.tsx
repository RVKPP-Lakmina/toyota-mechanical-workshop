import BillForm from "@/components/bill-form"

export default function NewBillPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Bill</h1>
        <p className="text-muted-foreground">Create a new bill for a customer</p>
      </div>
      <BillForm type="bill" />
    </div>
  )
}
