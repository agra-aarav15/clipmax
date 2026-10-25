import { AlertTriangleIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Shown when the running process is missing credentials. The studio never replaces a missing
 * integration with sample rows or a fake success state.
 */
export function StudioConfigurationState({
  keys,
  title = "Studio credentials are not set",
  description = "The landing and signup are real, but the studio cannot create a project until these are present in the running process. Nothing is mocked in their place.",
}: {
  keys: readonly string[];
  title?: string;
  description?: string;
}) {
  return (
    <Card className="border-amber-300/20 bg-amber-300/[0.03]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangleIcon className="size-4 text-amber-300" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 sm:grid-cols-2">
          {keys.map((key) => (
            <li
              key={key}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/60 px-3 py-2"
            >
              <code className="min-w-0 text-[0.6875rem] leading-relaxed break-all text-muted-foreground">
                {key}
              </code>
              <Badge variant="muted" className="shrink-0">
                Not set
              </Badge>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Copy <code className="text-foreground">.env.example</code> to{" "}
          <code className="text-foreground">.env.local</code>, fill the values, and restart the
          server. The dashboard will then show the real wallet and project rows.
        </p>
      </CardContent>
    </Card>
  );
}
