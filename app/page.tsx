"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail, School } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

import { useAuth } from "@/lib/auth/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!identifier.trim() || !password.trim()) {
      toast("Login failed", "Please enter your email and password", "error");
      return;
    }

    setIsLoading(true);
    try {
      await login({
        identifier: identifier.trim(),
        password,
      });

      toast("Login successful", "Redirecting to your dashboard", "success");
      router.push("/dashboard");
    } catch (error) {
      console.error("Login error", error);

      toast(
        "Login failed",
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-muted/40">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Branding Panel */}
        <section className="hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10">
              <School className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-lg font-bold">Apex School ERP</h1>
              <p className="text-sm text-primary-foreground/70">
                School Management System
              </p>
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="text-4xl font-bold leading-tight">
              Manage your school from one place.
            </h2>

            <p className="mt-4 text-sm leading-6 text-primary-foreground/75">
              Access students, academics, examinations, employees, attendance,
              fees, and other school operations through one centralized
              platform.
            </p>
          </div>

          <p className="text-xs text-primary-foreground/60">
            © {new Date().getFullYear()} Apex School ERP
          </p>
        </section>

        {/* Login Form */}
        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <div className="mb-6 flex items-center gap-3 lg:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <School className="h-5 w-5" />
                </div>

                <div>
                  <h1 className="font-bold">Apex School ERP</h1>
                  <p className="text-xs text-muted-foreground">
                    School Management System
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-bold">Welcome back</h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Sign in to access your school ERP account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="email"
                    type="text"
                    placeholder="name@example.com"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    className="pl-10"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pl-10 pr-10"
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
