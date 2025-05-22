import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
    })

    if (!event) {
      return new NextResponse('Event not found', { status: 404 })
    }

    return NextResponse.json(event)
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const event = await prisma.event.findUnique({
      where: { id: params.id },
    })

    if (!event) {
      return new NextResponse('Event not found', { status: 404 })
    }

    if (event.userId !== session.user.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const data = await request.json()
    const updatedEvent = await prisma.event.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json(updatedEvent)
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}