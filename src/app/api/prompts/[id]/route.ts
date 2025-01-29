import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUserId } from "@/lib/auth"

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, content } = body

    const prompt = await prisma.prompt.update({
      where: {
        id: params.id,
        userId: userId, // 确保只能更新自己的提示词
      },
      data: {
        name,
        content,
      },
    })

    return NextResponse.json(prompt)
  } catch (error) {
    console.error("Error updating prompt:", error)
    return NextResponse.json(
      { error: "Failed to update prompt" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.prompt.delete({
      where: {
        id: params.id,
        userId: userId, // 确保只能删除自己的提示词
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting prompt:", error)
    return NextResponse.json(
      { error: "Failed to delete prompt" },
      { status: 500 }
    )
  }
}