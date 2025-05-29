import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { createEventSchema } from "@/schemas/event";
import { cloudinary } from "@/lib/cloudinary";
import { v4 as uuidv4 } from "uuid";
import { UploadApiResponse } from "cloudinary";

export type CloudinaryUploadResponse = {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  asset_folder: string;
  display_name: string;
  original_filename: string;
  api_key: string;
};


export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    let savedImageUrl: string | undefined;

    const {
      event: { image, ...otherEventAttributes },
      fundraiser: fundraiserArgs,
    } = createEventSchema.parse(formData);
    
    if (image) {
      const imageFile = image instanceof File ? image : null;
    
      if (!imageFile) {
        console.error("Invalid image file");
        return NextResponse.json(
          { error: "Invalid image file" },
          { status: 400 }
        );
      }
    
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
    
      const fileExt = imageFile.name.split(".").pop();
      const publicId = uuidv4();
    
      console.log("Uploading to Cloudinary...");
    
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
    
      if (!uploadResult || typeof uploadResult === "string" ) {
        console.error("Cloudinary upload failed:", uploadResult);
        return NextResponse.json(
          { error: "Failed to upload image" },
          { status: 500 }
        );
      }
    
      savedImageUrl = uploadResult.url;
      console.log("Upload successful:", console.log(uploadResult));
    }

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
        image: savedImageUrl,
      },
    });
// return fundraiser 
    return NextResponse.json(event);
  } catch (error) {
    // TODO: Error handling for schema validation error
    console.error("Failed to create event:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
