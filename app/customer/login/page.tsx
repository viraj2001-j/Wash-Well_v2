import { redirect } from "next/navigation";

export default function CustomerLoginFallback() {
  redirect("/c/default/customer/login");
}
