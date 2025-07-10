import { type NextRequest, NextResponse } from "next/server"
import { customersService, getDefaultCompanyId } from "@/lib/database"

export async function GET() {
  try {
    const companyId = await getDefaultCompanyId()
    const customers = await customersService.getAll(companyId)
    return NextResponse.json(customers)
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const companyId = await getDefaultCompanyId()

    const customerData = {
      ...body,
      companyId,
    }

    const newCustomer = await customersService.create(customerData)
    return NextResponse.json(newCustomer)
  } catch (error) {
    console.error("Error creating customer:", error)
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
}
