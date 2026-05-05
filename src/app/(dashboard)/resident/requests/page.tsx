import { ResidentGuard } from "@/components/auth-guard";
import { ResidentDashboard } from "@/components/resident/dashboard/ResidentDashboard";

export default function ResidentRequestsPage() {
  return (
    <ResidentGuard>
      <ResidentDashboard view="requests" />
    </ResidentGuard>
  );
}
