import { ResidentGuard } from "@/components/auth-guard";
import { ResidentDashboard } from "@/components/resident/dashboard/ResidentDashboard";

export default function ResidentContactPage() {
  return (
    <ResidentGuard>
      <ResidentDashboard view="contact" />
    </ResidentGuard>
  );
}
