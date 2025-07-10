import { type NextRequest, NextResponse } from "next/server"
import { partsService, getDefaultCompanyId } from "@/lib/database"

export async function GET() {
  try {
    const companyId = await getDefaultCompanyId()
    const parts = await partsService.getAll(companyId)
    return NextResponse.json(parts)
  } catch (error) {
    console.error("Error fetching parts:", error)
    return NextResponse.json({ error: "Failed to fetch parts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const companyId = await getDefaultCompanyId()

    const partData = {
      ...body,
      companyId,
    }

    const newPart = await partsService.create(partData)
    return NextResponse.json(newPart)
  } catch (error) {
    console.error("Error creating part:", error)
    return NextResponse.json({ error: "Failed to create part" }, { status: 500 })
  }
}
