import { ResidentGuard } from "@/components/auth-guard";
import { ResidentDashboard } from "@/components/resident/dashboard/ResidentDashboard";

export default function ResidentNewsPage() {
  return (
    <ResidentGuard>
      <ResidentDashboard view="announcements" />
    </ResidentGuard>
  );
}
