/**
 * Recursively converts Prisma objects (Decimal, BigInt, Date) into plain JavaScript objects/primitives
 * suitable for Next.js React Server Component props serialization.
 */
export function serializeData<T>(data: T): T {
  if (data === null || data === undefined) return data;
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      if (value && typeof value === "object") {
        // Check for Prisma Decimal object or decimal-like structure
        if (
          (value.constructor && (value.constructor.name === "Decimal" || value.isDecimal)) ||
          (typeof value.s === "number" && Array.isArray(value.d))
        ) {
          const num = Number(value);
          return isNaN(num) ? 0 : num;
        }
      }
      return value;
    })
  );
}
