import { ResidentGuard } from "@/components/auth-guard";
import { ResidentDashboard } from "@/components/resident/dashboard/ResidentDashboard";

export default function ResidentProfilePage() {
  return (
    <ResidentGuard>
      <ResidentDashboard view="profile" />
    </ResidentGuard>
  );
}
