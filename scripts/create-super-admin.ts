import "dotenv/config";
import prisma from "../lib/db";

async function main() {
  const SUPABASE_USER_ID =
    "f3c302ce-d821-48e2-a432-57a0aef34ea9";

  const EMAIL =
    "superadmin@wash-well.local";

  const superAdminRole =
    await prisma.role.findFirst({
      where: {
        name: "SUPER_ADMIN",
        scope: "PLATFORM",
        companyId: null,
        isActive: true,
      },
    });

  if (!superAdminRole) {
    throw new Error(
      "Platform SUPER_ADMIN role not found.",
    );
  }

  const user = await prisma.user.upsert({
    where: {
      supabaseUserId: SUPABASE_USER_ID,
    },

    update: {
      fullName: "Super Admin",
      email: EMAIL,
      isActive: true,
    },

    create: {
      supabaseUserId: SUPABASE_USER_ID,

      companyId: null,

      branchId: null,

      fullName: "Super Admin",

      email: EMAIL,

      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: superAdminRole.id,
      },
    },

    update: {},

    create: {
      userId: user.id,
      roleId: superAdminRole.id,
    },
  });

  console.log("");
  console.log("SUPER ADMIN READY");
  console.log("-------------------------");
  console.log("Email:", user.email);
  console.log("User ID:", user.id);
  console.log("Supabase ID:", user.supabaseUserId);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });