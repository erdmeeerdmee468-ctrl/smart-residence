import { ResidentGuard } from "@/components/auth-guard";
import { ResidentDashboard } from "@/components/resident/dashboard/ResidentDashboard";

export default function ResidentDocsPage() {
  return (
    <ResidentGuard>
      <ResidentDashboard view="docs" />
    </ResidentGuard>
  );
}
