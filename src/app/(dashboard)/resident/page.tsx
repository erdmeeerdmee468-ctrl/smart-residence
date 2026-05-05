import { ResidentGuard } from "@/components/auth-guard";
import { ResidentDashboard } from "@/components/resident/dashboard/ResidentDashboard";

export default function ResidentPage() {
  return (
    <ResidentGuard>
      <ResidentDashboard view="overview" />
    </ResidentGuard>
  );
}
