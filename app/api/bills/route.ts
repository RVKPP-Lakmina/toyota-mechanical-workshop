import { type NextRequest, NextResponse } from "next/server"
import { billsService, getDefaultCompanyId } from "@/lib/database"

export async function GET() {
  try {
    const companyId = await getDefaultCompanyId()
    const bills = await billsService.getAll(companyId)
    return NextResponse.json(bills)
  } catch (error) {
    console.error("Error fetching bills:", error)
    return NextResponse.json({ error: "Failed to fetch bills" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const companyId = await getDefaultCompanyId()

    const billData = {
      ...body,
      companyId,
    }

    const newBill = await billsService.create(billData)
    return NextResponse.json(newBill)
  } catch (error) {
    console.error("Error creating bill:", error)
    return NextResponse.json({ error: "Failed to create bill" }, { status: 500 })
  }
}
