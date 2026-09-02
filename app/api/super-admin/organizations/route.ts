import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/lib/db";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const name = formData.get("name") as string;
    const code = formData.get("code") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const country = formData.get("country") as string;
    
    const file = formData.get("logo") as File;

    let logoUrl = null;

    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-logo.${fileExt}`;
      const filePath = `company-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("organizations")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        return NextResponse.json({ error: "Failed to upload image." }, { status: 500 });
      }

      const { data: publicUrlData } = supabase.storage
        .from("organizations")
        .getPublicUrl(filePath);

      logoUrl = publicUrlData.publicUrl;
    }

    const newCompany = await prisma.company.create({
      data: {
        name: name,
        code: code,
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        country: country || "Sri Lanka",
        logoUrl: logoUrl,
      },
    });

    return NextResponse.json(
      { success: true, company: newCompany }, 
      { status: 201 }
    );

  } catch (error: any) {
    console.error("API Error:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Company code already exists. Please use a different one." }, 
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong saving the company." }, 
      { status: 500 }
    );
  }
}
