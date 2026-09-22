"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { destroyManyByUrl } from "@/lib/cloudinary";

export async function deleteSection(sectionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
  });

  if (!section || section.userId !== session.user.id) {
    return { error: "Unauthorized or not found" };
  }

  // Manually cascade deletes since schema doesn't have onDelete: Cascade

  /* Read the files before the rows go: once the images are deleted there is
     nothing left to say what was in Cloudinary, and deleting an album used
     to strand every one of its photos there. */
  const doomed = await prisma.image.findMany({
    where: { sectionId },
    select: { originalUrl: true },
  });

  // 1. Delete all Notes for Images in this Section
  await prisma.note.deleteMany({
    where: {
      image: {
        sectionId: sectionId
      }
    }
  });

  // 2. Delete all Images in this Section
  await prisma.image.deleteMany({
    where: { sectionId }
  });

  // 3. Delete the Section itself (sticky notes cascade)
  try {
    await prisma.section.delete({
      where: { id: sectionId }
    });
  } catch (err) {
    console.error("deleteSection failed", err);
    return { error: "Couldn't delete this album. Please try again." };
  }

  // the album is gone either way; storage is cleaned up on a best effort
  await destroyManyByUrl(doomed.map((d) => d.originalUrl));

  revalidatePath('/');
  revalidatePath('/albums');

  return { success: true };
}
