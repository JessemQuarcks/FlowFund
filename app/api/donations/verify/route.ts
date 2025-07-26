import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DonorInfo } from "@/types";

export async function POST(request: Request) {
  const data = await request.json();
  const {
    reference,
    fundraiserId,
    donorInfo,
  }: { reference: string; fundraiserId: string; donorInfo: DonorInfo } = data;

  try {
    // Verify payment with Paystack
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const paymentData = await response.json();

    if (paymentData.status && paymentData.data.status === "success") {
      const { amount } = paymentData.data;

      // Create donation record
      const donation = await prisma.donation.create({
        data: {
          amount: amount / 100, // Convert from pesewas
          paymentDetails: paymentData,
          donorFirstName: donorInfo?.firstName,
          donorLastName: donorInfo?.lastName,
          donorEmail: donorInfo?.email,
          fundraiserId,
        },
      });

      const donationByUserCount = donorInfo?.email
        ? await prisma.donation.count({
            where: {
              donorEmail: donorInfo?.email,
            },
          })
        : 0;

      // Update fundraiser total
      await prisma.fundraiser.update({
        where: {
          id: fundraiserId,
        },
        data: {
          raisedAmount: {
            increment: amount / 100,
          },
          donorCount: {
            increment: donationByUserCount <= 1 ? 1 : 0,
          },
        },
      });

      return NextResponse.json({ success: true, donation }, { status: 200 });
    } else {
      return NextResponse.json(
        { message: "Payment verification failed" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
