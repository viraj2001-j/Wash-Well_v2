import dotenv from 'dotenv';
dotenv.config();

import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../app/generated/prisma/client';

async function testIPv4Connection() {
  console.log('\n--- TEST WITH ipv4first DNS RESOLUTION ---');
  console.log('Testing URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    const startTime = Date.now();
    const res = await pool.query('SELECT 1 as connected');
    console.log('SUCCESS! PG Pool SELECT 1 in', Date.now() - startTime, 'ms:', res.rows);

    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    const qRes = await prisma.$queryRaw`SELECT 1 as prisma_connected`;
    console.log('SUCCESS! Prisma $queryRaw in', Date.now() - startTime, 'ms:', qRes);

    const company = await prisma.company.findFirst();
    console.log('SUCCESS! prisma.company.findFirst():', company ? company.name : 'No company found');
    await prisma.$disconnect();
  } catch (err: any) {
    console.error('FAILED IPv4 Test:', err.message || err);
  } finally {
    await pool.end();
  }
}

testIPv4Connection();

