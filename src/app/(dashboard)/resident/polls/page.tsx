import { ResidentGuard } from "@/components/auth-guard";
import { ResidentDashboard } from "@/components/resident/dashboard/ResidentDashboard";

export default function ResidentPollsPage() {
  return (
    <ResidentGuard>
      <ResidentDashboard view="polls" />
    </ResidentGuard>
  );
}
