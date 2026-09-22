"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
/* The limits and the content check live in lib/sectionText so the editor can
   import them too — a "use server" module may only export async functions. */
import { Title, Description, checkContent } from "@/lib/sectionText";

export async function updateSectionDetails(sectionId: string, title: string, description: string, content?: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const t = Title.safeParse(title);
  if (!t.success) return { error: t.error.issues[0].message };
  const d = Description.safeParse(description ?? "");
  if (!d.success) return { error: d.error.issues[0].message };

  let clean: Record<string, string> | undefined;
  if (content !== undefined) {
    const checked = checkContent(content);
    if (!checked.ok) return { error: checked.error };
    clean = checked.value;
  }

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
  });

  if (!section || section.userId !== session.user.id) {
    return { error: "Unauthorized or not found" };
  }

  const dataToUpdate: Record<string, unknown> = { title: t.data, description: d.data };
  if (clean) {
    // Merge new content with existing content if it exists
    const raw = (section as { content?: unknown }).content;
    const existingContent =
      raw && typeof raw === "object" ? (raw as Record<string, unknown>)
      : typeof raw === "string" ? JSON.parse(raw)
      : {};
    dataToUpdate.content = { ...existingContent, ...clean };
  }

  await prisma.section.update({
    where: { id: sectionId },
    data: dataToUpdate,
  });

  revalidatePath(`/section/${sectionId}`);
  revalidatePath('/home');

  return { success: true };
}

export async function updateSectionTitle(sectionId: string, title: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const t = Title.safeParse(title);
  if (!t.success) return { success: false, error: t.error.issues[0].message };

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
  });

  if (!section || section.userId !== session.user.id) {
    return { success: false, error: "Unauthorized or not found" };
  }

  await prisma.section.update({
    where: { id: sectionId },
    data: { title: t.data },
  });

  revalidatePath(`/section/${sectionId}`);
  revalidatePath('/home');

  return { success: true };
}
