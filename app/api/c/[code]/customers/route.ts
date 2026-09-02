import { NextRequest, NextResponse } from "next/server";
import { verifyCompanyAccess } from "@/lib/services/security";
import { logActivity } from "@/lib/services/activity";
import prisma from "@/lib/db";
import { generateAndSendOTP } from "@/lib/services/otp";
import { formatPhoneNumber } from "@/lib/services/sms";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { company } = await verifyCompanyAccess(code);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    const where: any = { companyId: company.id };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { placeName: { contains: search, mode: "insensitive" } },
        { customerNo: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        contacts: true,
        addresses: true,
        businessTypeRef: true,
        routeLinks: { include: { route: true } },
        orders: {
          include: {
            invoice: { include: { allocations: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: customers });
  } catch (error: any) {
    console.error("GET /api/c/[code]/customers error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch customers" },
      { status: 400 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { user, company } = await verifyCompanyAccess(code);

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Uploaded data is invalid or too large." },
        { status: 400 }
      );
    }

    const {
      name,
      placeName,
      phone,
      email,
      customerType,
      paymentTerms,
      creditLimit,
      creditPeriodDays,
      businessTypeId,
      businessType,
      gpsLatitude,
      gpsLongitude,
      shopPhotos,
      address,
      city,
      routeId,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Customer name is required" }, { status: 400 });
    }

    const cleanPhone = phone ? formatPhoneNumber(phone) : null;
    const rawPhoneDigits = phone ? phone.replace(/\D/g, "") : null;

    // Check if customer with phone already exists for this company
    if (rawPhoneDigits && rawPhoneDigits.length >= 7) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          companyId: company.id,
          OR: [
            { phone: { contains: rawPhoneDigits } },
            { phone2: { contains: rawPhoneDigits } },
          ],
        },
      });

      if (existingCustomer) {
        return NextResponse.json(
          {
            success: false,
            error: `A customer named '${existingCustomer.name}' (${existingCustomer.customerNo}) already exists with phone number '${phone}' for ${company.name}.`,
          },
          { status: 400 }
        );
      }
    }

    // Resolve Business Type ID
    let validBusinessTypeId: string | null = null;
    if (businessTypeId) {
      const existingBt = await prisma.businessTypeRecord.findFirst({
        where: { id: businessTypeId, companyId: company.id },
      });
      if (existingBt) validBusinessTypeId = existingBt.id;
    }

    if (!validBusinessTypeId && businessType && typeof businessType === "string" && businessType.trim()) {
      const cleanBtName = businessType.trim();
      const existingByName = await prisma.businessTypeRecord.findFirst({
        where: {
          companyId: company.id,
          name: { equals: cleanBtName, mode: "insensitive" },
        },
      });

      if (existingByName) {
        validBusinessTypeId = existingByName.id;
      } else {
        const createdBt = await prisma.businessTypeRecord.create({
          data: { companyId: company.id, name: cleanBtName },
        });
        validBusinessTypeId = createdBt.id;
      }
    }

    // Generate Customer Number
    const customerCount = await prisma.customer.count({ where: { companyId: company.id } });
    const customerNo = `CUST-${(customerCount + 1).toString().padStart(5, "0")}`;

    const effectivePaymentTerms = paymentTerms || customerType || "Cash";
    const parsedCreditLimit = effectivePaymentTerms === "Credit" && creditLimit && !isNaN(parseFloat(creditLimit)) ? parseFloat(creditLimit) : null;
    const parsedCreditPeriodDays = effectivePaymentTerms === "Credit" && creditPeriodDays && !isNaN(parseInt(creditPeriodDays)) ? parseInt(creditPeriodDays) : null;
    const parsedGpsLat = gpsLatitude && !isNaN(parseFloat(gpsLatitude)) ? parseFloat(gpsLatitude) : null;
    const parsedGpsLng = gpsLongitude && !isNaN(parseFloat(gpsLongitude)) ? parseFloat(gpsLongitude) : null;
    const formattedPhotos = Array.isArray(shopPhotos) ? shopPhotos.filter((p) => typeof p === "string" && p.trim()) : [];

    const customer = await prisma.$transaction(async (tx) => {
      const created = await tx.customer.create({
        data: {
          companyId: company.id,
          customerNo,
          name: name.trim(),
          placeName: placeName ? placeName.trim() : null,
          phone: phone ? phone.trim() : null,
          email: email ? email.trim() : null,
          paymentTerms: effectivePaymentTerms,
          creditLimit: parsedCreditLimit,
          creditPeriodDays: parsedCreditPeriodDays,
          businessTypeId: validBusinessTypeId,
          gpsLatitude: parsedGpsLat,
          gpsLongitude: parsedGpsLng,
          shopPhotos: formattedPhotos,
          createdById: user.id,
          addresses: address && address.trim()
            ? {
                create: {
                  address: address.trim(),
                  city: city ? city.trim() : null,
                  isPrimary: true,
                },
              }
            : undefined,
          routeLinks: routeId
            ? {
                create: {
                  routeId,
                  isActive: true,
                },
              }
            : undefined,
        },
        include: {
          addresses: true,
          businessTypeRef: true,
          routeLinks: { include: { route: true } },
        },
      });

      return created;
    });

    // Auto-Provision User for Customer Portal (NO SMS SENT ON CREATION)
    if (phone && phone.trim()) {
      try {
        const customerEmail = email ? email.trim().toLowerCase() : `customer_${customer.id}@washwell.local`;
        const defaultPassword = `OtpPass_${customer.id.substring(0, 8)}!#99`;

        const supabaseAdmin = createAdminClient();
        let authUserId: string | null = null;

        const { data: authData } = await supabaseAdmin.auth.admin.createUser({
          email: customerEmail,
          password: defaultPassword,
          email_confirm: true,
          user_metadata: {
            fullName: customer.name,
            role: "CUSTOMER",
            companyCode: company.code,
            companyId: company.id,
            authType: "REP_OTP",
          },
        });

        if (authData?.user) {
          authUserId = authData.user.id;
        }

        if (authUserId) {
          let customerRole = await prisma.role.findFirst({
            where: { companyId: company.id, name: { equals: "CUSTOMER", mode: "insensitive" } },
          });

          if (!customerRole) {
            customerRole = await prisma.role.create({
              data: { companyId: company.id, name: "CUSTOMER", scope: "ORGANIZATION", isSystem: true },
            });
          }

          const customerUser = await prisma.user.create({
            data: {
              supabaseUserId: authUserId,
              companyId: company.id,
              fullName: customer.name,
              email: customerEmail,
              phone: customer.phone,
              isActive: true,
              termsAccepted: true,
              roles: { create: { roleId: customerRole.id } },
            },
          });

          await prisma.customer.update({
            where: { id: customer.id },
            data: { createdById: customerUser.id, isPhoneVerified: false },
          });
        }
      } catch (otpErr) {
        console.error("Failed to provision customer user:", otpErr);
      }
    }

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "CUSTOMER_CREATED",
      entityType: "CUSTOMER",
      entityId: customer.id,
      description: `Created customer ${customer.name} (${customer.customerNo})`,
    });

    return NextResponse.json({
      success: true,
      data: customer,
      message: `Customer '${customer.name}' created successfully!`,
    });
  } catch (error: any) {
    console.error("POST /api/c/[code]/customers error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create customer" },
      { status: 400 }
    );
  }
}
