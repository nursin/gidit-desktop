import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { GiditLogo } from "../icons/gidit-logo";
import { login, register } from "../../services/auth";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    setError(null);
    setLoading(true);
    try {
      await register(email.trim(), password);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden flex items-center justify-center min-h-screen bg-cream">
      {/* Subtle base light to keep the ellipse shape consistent */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_right,rgba(255,255,255,0.5),transparent_60%)]" />

      {/* Animated 8-color ellipse + pulse */}
      <div
        className="
          pointer-events-none absolute inset-0
          animated-gradient
          animate-glow8 animate-pulse-light
        "
      />

      <Card className="relative z-50 w-full max-w-md p-8 space-y-6 shadow-lg shadow-purple-600/20 bg-white">
        <div className="flex flex-col items-center text-center">
          <GiditLogo className="w-12 h-12 mb-4" />
          <h1 className="text-3xl font-bold">Welcome to Gidit</h1>
          <p className="text-muted-foreground">Sign in to continue to your dashboard</p>
        </div>

        <CardContent className="p-0 space-y-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Local account</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input border-none"
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input border-none"
              />
            </div>
          </div>

          {error && <p className="text-sm text-center text-destructive">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <Button
              className="w-full bg-violet-700/90 text-white"
              onClick={handleEmailSignIn}
              disabled={loading || !email || !password}
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>
            <Button
              className="w-full bg-gray-200"
              onClick={handleEmailSignUp}
              disabled={loading || !email || !password}
            >
              {loading ? "Registering..." : "Sign Up"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
