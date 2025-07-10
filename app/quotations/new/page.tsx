import BillForm from "@/components/bill-form"

export default function NewQuotationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Quotation</h1>
        <p className="text-muted-foreground">Create a new quotation for a customer</p>
      </div>
      <BillForm type="quotation" />
    </div>
  )
}
