"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { destroyByUrl } from "@/lib/cloudinary";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type ProfileResult = { ok: true } | { ok: false; error: string; field?: string };

/* Only the fields a person owns. Email is absent on purpose: it is the identity
   Google signs them in with, and admin access is matched on it, so letting it
   drift from the real account would break both. */
const Profile = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(80, "That name is too long"),
  // deliberately loose: numbers are written a dozen different ways and a strict
  // pattern rejects more real numbers than fake ones
  phone: z.string().trim().max(32, "That number is too long")
    .refine((v) => v === "" || /^[+()\d][\d\s().-]{5,}$/.test(v), "That doesn't look like a phone number"),
  location: z.string().trim().max(80, "That location is too long"),
  bio: z.string().trim().max(280, "Keep it under 280 characters"),
  image: z.string().trim().max(2048),
});

export async function updateProfile(input: unknown): Promise<ProfileResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "You are signed out" };

  const parsed = Profile.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first.message, field: String(first.path[0] ?? "") };
  }
  const { name, phone, location, bio, image } = parsed.data;

  // a picture must be one we host, or this becomes a way to point every page at
  // an arbitrary server
  if (image && !/^https:\/\/res\.cloudinary\.com\//.test(image)) {
    return { ok: false, error: "That image could not be saved", field: "image" };
  }

  /* The picture being replaced, so the old one can be cleared out. Only
     ever ours: a Google avatar lives on Google's servers and is not a file
     this app has any business deleting — the helper's folder check refuses
     anything outside memory_lane/ anyway. */
  const previous = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      phone: phone || null,
      location: location || null,
      bio: bio || null,
      ...(image ? { image } : {}),
    },
  });

  if (image && previous?.image && previous.image !== image) {
    await destroyByUrl(previous.image);
  }

  revalidatePath("/profile");
  revalidatePath("/");
  return { ok: true };
}
