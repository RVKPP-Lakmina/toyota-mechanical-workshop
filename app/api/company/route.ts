import { type NextRequest, NextResponse } from "next/server"
import { companyService } from "@/lib/database"

export async function GET() {
  try {
    const company = await companyService.get()
    return NextResponse.json(company)
  } catch (error) {
    console.error("Error fetching company:", error)
    return NextResponse.json({ error: "Failed to fetch company" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 })
    }

    const updatedCompany = await companyService.update(id, data)
    return NextResponse.json(updatedCompany)
  } catch (error) {
    console.error("Error updating company:", error)
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 })
  }
}
