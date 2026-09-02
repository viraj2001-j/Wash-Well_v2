import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

function getConnectionString() {
  let url = process.env.DATABASE_URL || "";
  if (!url) return url;

  url = url.replace(/sslmode=verify-full/g, "sslmode=require");
  url = url.replace(/&channel_binding=require/g, "");
  url = url.replace(/\?channel_binding=require&?/g, "?");

  return url;
}

export function getPrismaInstance(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const pool = new Pool({
    connectionString: getConnectionString(),
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 1000,
    connectionTimeoutMillis: 5000,
  });

  pool.on("error", (err) => {
    console.warn("PG Pool socket reset:", err.message);
  });

  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.pgPool = pool;
  }

  return client;
}

const prisma = getPrismaInstance();

export default prisma;