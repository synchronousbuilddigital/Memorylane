import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* The signed-in person's profile, read from the database rather than the
   session.

   The session is a JWT holding whatever Google returned at sign-in, and it
   lives for days. If the bar read from it, someone who changed their name or
   picture would keep seeing the old one until their token happened to refresh.
   One lookup by primary key is the right trade for something shown on every
   page. */
export type Viewer = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  phone: string | null;
  bio: string | null;
  location: string | null;
  isAdmin: boolean;
};

export async function currentProfile(): Promise<Viewer | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, phone: true, bio: true, location: true, role: true },
  });
  if (!user) return null;

  const { role, ...rest } = user;
  return { ...rest, isAdmin: role === "ADMIN" };
}
