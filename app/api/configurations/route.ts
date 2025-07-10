import { type NextRequest, NextResponse } from "next/server"
import { configurationService, getDefaultCompanyId } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const configType = searchParams.get("type")

    if (!configType) {
      return NextResponse.json({ error: "Config type is required" }, { status: 400 })
    }

    const companyId = await getDefaultCompanyId()
    const configs = await configurationService.getByType(companyId, configType)
    return NextResponse.json(configs)
  } catch (error) {
    console.error("Error fetching configurations:", error)
    return NextResponse.json({ error: "Failed to fetch configurations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { configType, configKey, configValue } = body

    const companyId = await getDefaultCompanyId()
    const result = await configurationService.upsert(companyId, configType, configKey, configValue)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error saving configuration:", error)
    return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 })
  }
}
