import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/40">
          <ShieldAlert className="h-7 w-7 text-red-600 dark:text-red-400" />
        </div>

        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Access Denied
        </h1>

        <p className="mt-2 text-xs text-muted-foreground">
          You do not have the required permission to view this page. If you
          believe this is a mistake, contact your administrator.
        </p>

        <Button className="mt-6 bg-blue-600 text-xs hover:bg-blue-700">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}