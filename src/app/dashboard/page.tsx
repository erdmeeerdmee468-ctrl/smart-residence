import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  if (user.role === "SOH") {
    redirect("/soh");
  }

  redirect("/resident");
}
