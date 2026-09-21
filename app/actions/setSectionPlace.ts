"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type PlaceResult = { ok: true } | { ok: false; error: string };

const Place = z.object({
  sectionId: z.string().min(1).max(64),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  placeName: z.string().trim().max(120),
});

/** Pins an album to a point on the globe. Only its owner may. */
export async function setSectionPlace(input: unknown): Promise<PlaceResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "You are signed out" };

  const parsed = Place.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That location could not be read" };
  const { sectionId, lat, lng, placeName } = parsed.data;

  const owned = await prisma.section.findFirst({
    where: { id: sectionId, userId: session.user.id },
    select: { id: true },
  });
  if (!owned) return { ok: false, error: "Album not found" };

  await prisma.section.update({
    where: { id: sectionId },
    data: { lat, lng, placeName: placeName || null },
  });
  revalidatePath("/map");
  revalidatePath(`/section/${sectionId}`);
  return { ok: true };
}

/** Takes an album back off the globe. */
export async function clearSectionPlace(sectionId: string): Promise<PlaceResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "You are signed out" };

  const owned = await prisma.section.findFirst({
    where: { id: sectionId, userId: session.user.id },
    select: { id: true },
  });
  if (!owned) return { ok: false, error: "Album not found" };

  await prisma.section.update({ where: { id: sectionId }, data: { lat: null, lng: null, placeName: null } });
  revalidatePath("/map");
  revalidatePath(`/section/${sectionId}`);
  return { ok: true };
}
