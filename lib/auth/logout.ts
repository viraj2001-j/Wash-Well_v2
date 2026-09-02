"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function logout(param?: string | FormData) {
  const supabase = await createClient();

  await supabase.auth.signOut();

  let code: string | null = null;
  if (typeof param === "string" && param) {
    code = param;
  } else if (param && typeof param === "object" && "get" in param) {
    const value = (param as FormData).get("companyCode");
    if (typeof value === "string" && value) {
      code = value;
    }
  }

  if (code) {
    redirect(`/c/${code}/login`);
  }

  redirect("/login");
}