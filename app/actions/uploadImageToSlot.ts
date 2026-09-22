"use server";

import { prisma } from "@/lib/prisma";
import { destroyByUrl } from "@/lib/cloudinary";
import { auth } from "@/lib/auth";

export async function uploadImageToSlotAction({
  url,
  sectionId,
  position,
  width,
  height,
  allowMultiple = false,
}: {
  url: string;
  sectionId: string;
  position: number;
  width?: number;
  height?: number;
  allowMultiple?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Verify the section belongs to the user
  const section = await prisma.section.findUnique({
    where: { id: sectionId }
  });

  if (!section || section.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  // Find if an image already exists at this position
  let existingImage = null;
  if (!allowMultiple) {
    existingImage = await prisma.image.findFirst({
      where: {
        sectionId,
        position,
      }
    });
  }

  if (existingImage) {
    const replaced = existingImage.originalUrl;

    // Update existing slot
    await prisma.image.update({
      where: { id: existingImage.id },
      data: {
        originalUrl: url,
        displayUrl: url,
        thumbUrl: url,
        width: width || 800,
        height: height || 600,
      }
    });

    /* Swapping a slot's photo is a delete nobody thinks of as one: the row
       is reused, so the picture that was there becomes unreferenced the
       moment this runs. Left alone it was the quietest of the storage leaks,
       and on an album edited a few times, the largest. */
    if (replaced && replaced !== url) await destroyByUrl(replaced);
  } else {
    // Create new image in this slot
    await prisma.image.create({
      data: {
        originalUrl: url,
        displayUrl: url,
        thumbUrl: url,
        position,
        sectionId,
        width: width || 800,
        height: height || 600,
      }
    });
  }
}
