// app/api/events/[id]/route.ts
import { NextResponse } from "next/server";
import { use } from "react";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";
import { v4 as uuidv4 } from "uuid";
import { UploadApiResponse } from "cloudinary";

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
export async function  PATCH(
  request: Request,
  { params }: { params:Promise<{ id: string }> }
) {
  try {
    const {id} = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check if event exists and user owns it
    const existingEvent = await prisma.event.findUnique({
      where:{id},
      include: { fundraiser: true },
    });

    if (!existingEvent) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    if (existingEvent.userId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const contentType = request.headers.get("content-type");
    let updateData: any;
    let imageFile: File | null = null;

    if (contentType?.includes("multipart/form-data")) {
      // Handle form data with file upload
      const formData = await request.formData();
      imageFile = formData.get("image") as File | null;
      
      updateData = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        target: Number(formData.get("target")),
        category: formData.get("category") as string,
        endDate: formData.get("endDate") as string,
        minDonation: formData.get("minDonation") ? Number(formData.get("minDonation")) : null,
        maxDonation: formData.get("maxDonation") ? Number(formData.get("maxDonation")) : null,
        allowAnonymous: formData.get("allowAnonymous") === "on" || formData.get("allowAnonymous") === "true",
      };
    } else {
      // Handle JSON data
      updateData = await request.json();
    }

    let savedImageUrl: string | undefined = existingEvent.fundraiser?.image || undefined;

    // Handle image upload if new image is provided
    if (imageFile && imageFile.size > 0) {
      // Delete old image from Cloudinary if it exists
      if (existingEvent.fundraiser?.image) {
        try {
          // Extract public_id from the URL
          const urlParts = existingEvent.fundraiser.image.split('/');
          const publicIdWithExtension = urlParts[urlParts.length - 1];
          const publicId = `event-images/${publicIdWithExtension.split('.')[0]}`;
          
          await cloudinary.uploader.destroy(publicId);
        } catch (deleteError) {
          console.error("Failed to delete old image:", deleteError);
          // Continue with upload even if deletion fails
        }
      }

      // Upload new image
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const publicId = uuidv4();

      const uploadResult: UploadApiResponse | undefined = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "event-images",
              resource_type: "image",
              public_id: publicId,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          )
          .end(buffer);
      });

      if (!uploadResult || typeof uploadResult === "string") {
        console.error("Cloudinary upload failed:", uploadResult);
        return NextResponse.json(
          { error: "Failed to upload image" },
          { status: 500 }
        );
      }

      savedImageUrl = uploadResult.url;
    }

    // Update event
    const updatedEvent = await prisma.event.update({
      where: {id},
      data: {
        title: updateData.title,
        description: updateData.description,
        category: updateData.category.toUpperCase(),
      },
    });

    // Update fundraiser if it exists
    if (existingEvent.fundraiser) {
      await prisma.fundraiser.update({
        where: { id: existingEvent.fundraiser.id },
        data: {
          targetAmount: updateData.target,
          endDate: new Date(updateData.endDate),
          minimumAmount: updateData.minDonation || 0,
          anonymity: updateData.allowAnonymous,
          image: savedImageUrl,
        },
      });
    }

    return NextResponse.json({ 
      message: "Event updated successfully",
      event: updatedEvent 
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