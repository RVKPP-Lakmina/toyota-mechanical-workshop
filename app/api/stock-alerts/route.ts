import { NextResponse } from "next/server"
import { partsService, getDefaultCompanyId } from "@/lib/database"

export async function GET() {
  try {
    const companyId = await getDefaultCompanyId()
    const [lowStock, outOfStock] = await Promise.all([
      partsService.getLowStock(companyId),
      partsService.getOutOfStock(companyId),
    ])

    return NextResponse.json({ lowStock, outOfStock })
  } catch (error) {
    console.error("Error fetching stock alerts:", error)
    return NextResponse.json({ error: "Failed to fetch stock alerts" }, { status: 500 })
  }
}
