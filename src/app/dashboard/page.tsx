import { cookies } from "next/headers";
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  // Cookie-с хэрэглэгчийн role-г авч тохирох хуудас руу шилжүүлнэ
  const jar = await cookies();
  const userRole = jar.get("userRole")?.value;

  if (!userRole) {
    redirect('/login');
  }

  // Role-оос хамаарч тохирох хуудас руу шилжүүлнэ
  if (userRole === "ADMIN") {
    redirect('/admin');
  } else if (userRole === "SOH") {
    redirect('/soh');
  } else {
    redirect('/resident');
  }
}
