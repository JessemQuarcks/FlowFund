// app/api/events/[id]/route.ts
import { NextResponse } from "next/server";
import { use } from "react";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";
import { v4 as uuidv4 } from "uuid";
import { UploadApiResponse } from "cloudinary";
import { Event_Category } from "@/lib/generated/prisma";






function extractPublicId(url: string): string {
  const parts = url.split('/')
  const filename = parts[parts.length - 1]
  return `event-images/${filename.split('.')[0]}`
}
// GET - Fetch single event
export async function GET(
  request: Request,
  { params }: { params:Promise<{ id: string }> }
) {
  try {
    const {id} =await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: {
        id,
      },
      include: {
        fundraiser: true,
      },
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    // Check if user owns this event
    if (event.userId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Transform the data to match what the frontend expects
    const transformedEvent = {
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category.toLowerCase(),
      target: Number(event.fundraiser?.targetAmount || 0),
      endDate: event.fundraiser?.endDate ? new Date(event.fundraiser.endDate).toISOString().split('T')[0] : '',
      minDonation: Number(event.fundraiser?.minimumAmount || ''),
      allowAnonymous: event.fundraiser?.anonymity || false,
      image: event.fundraiser?.image || null,
      raisedAmount: Number(event.fundraiser?.raisedAmount || 0),
      donorCount: event.fundraiser?.donorCount || 0,
    };

    return NextResponse.json(transformedEvent);
  } catch (error) {
    console.error("Failed to fetch event:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH - Update event
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const existingEvent = await prisma.event.findUnique({
      where: { id },
      include: { fundraiser: true },
    });

    if (!existingEvent) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    if (existingEvent.userId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const category= formData.get("category") as string
    const validCategories = ["COMMUNITY", "EDUCATION", "MEDICAL", "EMERGENCY", "NONPROFIT", "ANIMALS", "ENVIRONMENT", "OTHER"]
    if (!validCategories.includes(category.toUpperCase())) {
      return NextResponse.json(
        { message: "Invalid category" },
        { status: 400 }
      )
    }
    const updateData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      category: category.toUpperCase() as Event_Category,
      target: Number(formData.get("target")),
      endDate: formData.get("endDate") as string,
      minDonation: Number(formData.get("minDonation")),
      allowAnonymous: formData.get("allowAnonymous") === "true",
    };
    const imageFile = formData.get("image") as File | null;

    let imageInfo = {
      oldImageDeleted: false,
      oldPublicId: null as string | null,
      newImageUrl: null as string | null,
      newPublicId: null as string | null,
    };

    if (imageFile && imageFile.size > 0) {
      if (existingEvent.fundraiser?.image) {
        try {
          const oldUrl = existingEvent.fundraiser.image;
          const publicId = extractPublicId(oldUrl);
          imageInfo.oldPublicId = publicId;
          await cloudinary.uploader.destroy(publicId);
          imageInfo.oldImageDeleted = true;
          console.log(`Old image deleted successfully: ${publicId}`);
        } catch (deleteError) {
          console.error("Failed to delete old image:", deleteError);
        }
      }

      try {
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const publicId = `event-images/${uuidv4()}`;

        const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: "event-images",
              resource_type: "auto",
              public_id: publicId,
            },
            (error, result) => (error ? reject(error) : resolve(result!))
          ).end(buffer);
        });

        imageInfo.newImageUrl = uploadResult.secure_url;
        imageInfo.newPublicId = uploadResult.public_id;
        console.log(`Image uploaded successfully: ${uploadResult.public_id}`);
      } catch (uploadError) {
        console.error("Failed to upload image:", uploadError);
        return NextResponse.json(
          { message: "Failed to upload image" },
          { status: 500 }
        );
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        title: updateData.title,
        description: updateData.description,
        category: updateData.category,
      },
    });

    if (existingEvent.fundraiser) {
      await prisma.fundraiser.update({
        where: { id: existingEvent.fundraiser.id },
        data: {
          targetAmount: updateData.target,
          endDate: new Date(updateData.endDate),
          minimumAmount: updateData.minDonation || 0,
          anonymity: updateData.allowAnonymous,
          image: imageInfo.newImageUrl || existingEvent.fundraiser.image,
        },
      });
    }

    return NextResponse.json({
      message: "Event updated successfully",
      event: updatedEvent,
      imageInfo,
    });
  } catch (error) {
    console.error("Failed to update event:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete event (optional)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: { fundraiser: true },
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    if (event.userId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Delete image from Cloudinary if it exists
    if (event.fundraiser?.image) {
      try {
        const urlParts = event.fundraiser.image.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = `event-images/${publicIdWithExtension.split('.')[0]}`;
        
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.error("Failed to delete image:", deleteError);
      }
    }

    // Delete event (this will cascade delete the fundraiser due to foreign key constraints)
    await prisma.event.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Failed to delete event:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}