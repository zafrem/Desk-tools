"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

// The SSH terminal moved to Consoles > SSH. Keep old bookmarks working.
export default function SshTerminalRedirect() {
  const router = useRouter();
  React.useEffect(() => {
    router.replace("/tools/consoles/ssh/");
  }, [router]);
  return <p className="p-8 text-sm text-muted-foreground">Moved to Consoles → SSH…</p>;
}
