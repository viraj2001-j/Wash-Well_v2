import { cache } from "react";
import prisma from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !authUser) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      supabaseUserId: authUser.id,
    },

    include: {
      company: true,
      branch: true,

      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return user;
});