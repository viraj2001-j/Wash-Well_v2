import { redirect } from "next/navigation";

export default function CustomerDashboardFallback() {
  redirect("/c/default/customer/dashboard");
}
