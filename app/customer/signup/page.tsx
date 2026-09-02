import { redirect } from "next/navigation";

export default function CustomerSignupFallback() {
  redirect("/c/default/customer/signup");
}
