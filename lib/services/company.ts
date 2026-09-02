import { cache } from "react";
import prisma from "@/lib/db";

export const getCompanyByCode = cache(async (code: string) => {
  if (!code) return null;
  return await prisma.company.findUnique({
    where: { code },
  });
});

