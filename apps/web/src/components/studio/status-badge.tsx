import type { ProjectStatus } from "@clipmax/shared";

import { Badge } from "@/components/ui/badge";

const LABELS: Record<ProjectStatus, string> = {
  uploading: "Uploading",
  ready: "Queued",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  if (status === "failed") return <Badge variant="destructive">Failed</Badge>;

  if (status === "completed") {
    return (
      <Badge variant="outline" className="border-signal/30 text-signal">
        Completed
      </Badge>
    );
  }

  if (status === "uploading") return <Badge variant="muted">Uploading</Badge>;

  return <Badge>{LABELS[status]}</Badge>;
}
