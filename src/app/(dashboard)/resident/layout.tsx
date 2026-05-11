import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

export default async function ResidentLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "RESIDENT" && user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return <>{children}</>;
}