import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withdrawRequestSchema } from "@/schemas/withradawal";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const {
      eventId,
      amount,
      accountHolderName,
      accountNumber,
      bankCode,
      accountType,
      notes,
    } = withdrawRequestSchema.parse(body);

    const fundraiser = await prisma.fundraiser.findFirst({
      where: {
        eventId,
        event: {
          userId: session.user.id,
        },
      },
      include: {
        event: true,
      },
    });

    if (!fundraiser) {
      return NextResponse.json({
        message: "Fundraising Event not found or access denied",
      });
    }

    if (amount > fundraiser.raisedAmount - fundraiser.totalWithdrawn) {
      return NextResponse.json(
        { message: "Insufficient funds" },
        { status: 400 }
      );
    }

    // Create transfer recipient
    const recipientResponse = await fetch(
      "https://api.paystack.co/transferrecipient",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "ghipss",
          name: accountHolderName,
          account_number: accountNumber,
          bank_code: bankCode,
          currency: "GHS",
        }),
      }
    );

    const recipient = await recipientResponse.json();

    if (!recipient.status) {
      return NextResponse.json(
        { message: "Invalid account details" },
        { status: 400 }
      );
    }

    // Initiate Transfer
    const transferResponse = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "balance",
        amount: amount * 100, // Convert to pesewas
        recipient: recipient.data.recipient_code,
        reason: notes ?? `Withdrawal for event: ${fundraiser.event.title}`,
        currency: "GHS",
      }),
    });

    const transfer = await transferResponse.json();

    // TODO: Upgrade PayStack account to Registered Business and uncomment this line
    // if (!transfer.status) {
    //   return NextResponse.json({ message: "Transfer failed" }, { status: 400 });
    // }

    await prisma.withdrawal.create({
      data: {
        amount,
        accountType,
        fundraiserId: fundraiser.id,
        status: "COMPLETED",
        recipientCode: recipient.data.recipient_code,
        userId: session.user.id,
        notes,
        paymentDetails: transfer,
      },
    });

    await prisma.fundraiser.update({
      where: { eventId },
      data: {
        totalWithdrawn: {
          increment: amount,
        },
      },
    });

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
      },
      include: {
        fundraiser: true,
      },
    });

    return NextResponse.json({ success: true, data: event }, { status: 200 });
  } catch (error) {
    console.error("Withdrawal error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
