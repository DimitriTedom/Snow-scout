import { prisma } from "@/lib/prisma";

type AuthUser = {
  id: string;
  email?: string | null;
};

export async function syncUserFromAuth(user: AuthUser, displayName?: string | null) {
  if (!user.email) return;

  await prisma.user.upsert({
    where: { id: user.id },
    update: { email: user.email },
    create: {
      id: user.id,
      email: user.email,
      profile: {
        create: {
          displayName: displayName?.trim() || null,
        },
      },
    },
  });
}