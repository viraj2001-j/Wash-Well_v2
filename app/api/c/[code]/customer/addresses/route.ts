import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";

async function getCustomerForUser(companyCode: string, userId: string, userEmail: string) {
  let company = await prisma.company.findUnique({ where: { code: companyCode } });
  
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: (companyCode || "Company").toUpperCase(),
        code: companyCode || "default",
        isActive: true,
      },
    });
  }

  let customer = await prisma.customer.findFirst({
    where: {
      companyId: company.id,
      OR: [{ createdById: userId }, { email: userEmail }],
    },
  });

  if (!customer) {
    const count = await prisma.customer.count({ where: { companyId: company.id } });
    const customerNo = `CUST-${(count + 1).toString().padStart(5, "0")}`;
    customer = await prisma.customer.create({
      data: {
        companyId: company.id,
        customerNo,
        name: "Valued Customer",
        email: userEmail,
        createdById: userId,
      },
    });
  }

  return { company, customer };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const res = await getCustomerForUser(code, user.id, user.email);
    if (!res || !res.customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    const { company, customer } = res;

    const addresses = await prisma.customerAddress.findMany({
      where: { customerId: customer.id },
      include: {
        route: {
          select: {
            id: true,
            code: true,
            name: true,
            district: true,
            area: true,
          },
        },
      },
      orderBy: [{ isPrimary: "desc" }, { id: "desc" }],
    });

    let routes = await prisma.route.findMany({
      where: { companyId: company.id },
      select: {
        id: true,
        code: true,
        name: true,
        district: true,
        area: true,
      },
      orderBy: { name: "asc" },
    });

    if (routes.length === 0) {
      routes = await prisma.route.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          district: true,
          area: true,
        },
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json({ success: true, addresses, routes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const res = await getCustomerForUser(code, user.id, user.email);
    if (!res || !res.customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    const { customer } = res;

    const body = await req.json();
    const { label, address, city, district, postalCode, routeId, latitude, longitude, isPrimary } = body;

    if (!address || !address.trim()) {
      return NextResponse.json({ success: false, error: "Address is required" }, { status: 400 });
    }

    if (isPrimary) {
      await prisma.customerAddress.updateMany({
        where: { customerId: customer.id },
        data: { isPrimary: false },
      });
    }

    const newAddress = await prisma.customerAddress.create({
      data: {
        customerId: customer.id,
        label: label ? label.trim() : "Home",
        address: address.trim(),
        city: city ? city.trim() : null,
        district: district ? district.trim() : null,
        postalCode: postalCode ? postalCode.trim() : null,
        routeId: routeId ? routeId : null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        isPrimary: Boolean(isPrimary),
      },
      include: {
        route: {
          select: {
            id: true,
            code: true,
            name: true,
            district: true,
            area: true,
          },
        },
      },
    });

    if (routeId) {
      const existingLink = await prisma.routeCustomer.findFirst({
        where: { customerId: customer.id, routeId },
      });
      if (!existingLink) {
        await prisma.routeCustomer.create({
          data: {
            customerId: customer.id,
            routeId,
            isActive: true,
          },
        });
      }
    }

    return NextResponse.json({ success: true, address: newAddress });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const res = await getCustomerForUser(code, user.id, user.email);
    if (!res || !res.customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    const { customer } = res;

    const body = await req.json();
    const { id, label, address, city, district, postalCode, routeId, latitude, longitude, isPrimary } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Address ID required" }, { status: 400 });
    }

    if (isPrimary) {
      await prisma.customerAddress.updateMany({
        where: { customerId: customer.id },
        data: { isPrimary: false },
      });
    }

    const updatedAddress = await prisma.customerAddress.update({
      where: { id },
      data: {
        label: label ? label.trim() : undefined,
        address: address ? address.trim() : undefined,
        city: city !== undefined ? (city ? city.trim() : null) : undefined,
        district: district !== undefined ? (district ? district.trim() : null) : undefined,
        postalCode: postalCode !== undefined ? (postalCode ? postalCode.trim() : null) : undefined,
        routeId: routeId !== undefined ? (routeId ? routeId : null) : undefined,
        latitude: latitude !== undefined ? (latitude ? parseFloat(latitude) : null) : undefined,
        longitude: longitude !== undefined ? (longitude ? parseFloat(longitude) : null) : undefined,
        isPrimary: isPrimary !== undefined ? Boolean(isPrimary) : undefined,
      },
      include: {
        route: {
          select: {
            id: true,
            code: true,
            name: true,
            district: true,
            area: true,
          },
        },
      },
    });

    if (routeId) {
      const existingLink = await prisma.routeCustomer.findFirst({
        where: { customerId: customer.id, routeId },
      });
      if (!existingLink) {
        await prisma.routeCustomer.create({
          data: {
            customerId: customer.id,
            routeId,
            isActive: true,
          },
        });
      }
    }

    return NextResponse.json({ success: true, address: updatedAddress });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Address ID required" }, { status: 400 });
    }

    await prisma.customerAddress.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
