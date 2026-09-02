import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import {
  PrismaClient,
  RoleScope,
} from "../app/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const supabaseUserId =
    process.env.SUPABASE_SUPER_ADMIN_ID;

  if (!supabaseUserId) {
    throw new Error(
      "SUPABASE_SUPER_ADMIN_ID is not configured"
    );
  }

  const email =
    process.env.SUPER_ADMIN_EMAIL ||
    "superadmin@wash-well.local";

  const fullName =
    process.env.SUPER_ADMIN_NAME ||
    "Platform Super Admin";

  // Create Platform Super Admin role
  const role = await prisma.role.create({
    data: {
      companyId: null,
      name: "SUPERADMIN",
      scope: RoleScope.PLATFORM,
      description: "Platform Super Administrator",
      isSystem: true,
      isActive: true,
    },
  });

  // Create Prisma Super Admin user
  const user = await prisma.user.create({
    data: {
      supabaseUserId: supabaseUserId,

      companyId: null,

      branchId: null,

      fullName: fullName,

      username: "superadmin",

      email: email,

      isActive: true,
    },
  });

  // Connect user with role
  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: role.id,
    },
  });

  console.log("");
  console.log("==============================");
  console.log("SUPER ADMIN CREATED");
  console.log("==============================");
  console.log("Name:", user.fullName);
  console.log("Email:", user.email);
  console.log("Prisma ID:", user.id);
  console.log("Supabase ID:", user.supabaseUserId);
  console.log("Role:", role.name);
  console.log("Scope:", role.scope);
  console.log("==============================");
}

main()
  .catch((error) => {
    console.error("Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });