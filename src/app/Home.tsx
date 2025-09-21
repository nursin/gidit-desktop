import { useEffect, useState } from "react";
import { Builder } from "@/components/builder/builder";
import { AuthForm } from "@/components/auth/auth-form";
import { GiditLogo } from "@/components/icons/gidit-logo";
import { authService } from "@/services/auth";

/**
 * Local user shape used by the app.
 * Keep this in sync with the shape returned by the main process (SQLite/IPC).
 */
export type LocalUser = {
  id: string;
  username: string;
  email?: string | null;
};

export default function Home() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get current session once on mount
    authService
      .getSession()
      .then((u) => {
        if (!mounted) return;
        setUser(u);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to get session", err);
        if (!mounted) return;
        setUser(null);
        setLoading(false);
      });

    // Subscribe to auth changes emitted from the main process (via preload/IPC)
    const unsubscribe = authService.subscribe((u: LocalUser | null) => {
      if (!mounted) return;
      setUser(u);
    });

    return () => {
      mounted = false;
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-secondary/30">
        <GiditLogo className="w-16 h-16 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return <Builder />;
}
