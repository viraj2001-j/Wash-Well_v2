import prisma from "@/lib/db";

export interface LogActivityParams {
  companyId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  description?: string | null;
  metadata?: any;
}

export async function logActivity(params: LogActivityParams) {
  try {
    return await prisma.activityLog.create({
      data: {
        companyId: params.companyId,
        userId: params.userId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        description: params.description || null,
        metadata: params.metadata || undefined,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
