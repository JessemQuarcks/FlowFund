import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { createEventSchema } from "@/schemas/event";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await request.formData();

    const {
      event: { image, ...otherEventAttributes },
      fundraiser: fundraiserArgs,
    } = createEventSchema.parse(formData);

    //TODO: Handle file upload -> Firebase

    const event = await prisma.event.create({
      data: {
        ...otherEventAttributes,
        userId: session.user.id,
      },
    });

    const fundraiser = await prisma.fundraiser.create({
      data: {
        eventId: event.id,
        ...fundraiserArgs,
        donorCount: 0,
        totalWithdrawn: 0,
        raisedAmount: 0,
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    // TODO: Error handling for schema validation error
    console.error("Failed to create event:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
