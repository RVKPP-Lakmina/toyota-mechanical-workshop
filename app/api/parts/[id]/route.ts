import { type NextRequest, NextResponse } from "next/server"
import { partsService } from "@/lib/database"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const updatedPart = await partsService.update(params.id, body)
    return NextResponse.json(updatedPart)
  } catch (error) {
    console.error("Error updating part:", error)
    return NextResponse.json({ error: "Failed to update part" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await partsService.softDelete(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting part:", error)
    return NextResponse.json({ error: "Failed to delete part" }, { status: 500 })
  }
}
