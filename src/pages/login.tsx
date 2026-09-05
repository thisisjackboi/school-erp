import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Eye,
  EyeOff,
  GraduationCap,
  IndianRupee,
  LockKeyhole,
  School,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

import { useAuth } from "@/lib/auth/auth-context";
import {
  LIMITS,
  onlyUsername,
  validateRequired,
} from "@/lib/input-restrictions";

export default function LoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!identifier.trim() || !password.trim()) {
      toast("Login failed", "Please enter your username and password", "error");
      return;
    }

    const usernameError = validateRequired(identifier, "Username");
    if (usernameError) {
      toast("Login failed", usernameError, "error");
      return;
    }

    if (password.trim().length > LIMITS.TEXT_MAX) {
      toast(
        "Login failed",
        `Password cannot exceed ${LIMITS.TEXT_MAX} characters`,
        "error",
      );
      return;
    }

    setIsLoading(true);
    try {
      await login({
        identifier: identifier.trim(),
        password,
      });

      toast("Login successful", "Redirecting to your dashboard", "success");
      navigate("/dashboard");
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
              <h1 className="text-lg font-bold">PrismaEd+</h1>
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

            <div className="mt-8">
              <p className="text-xs font-bold uppercase tracking-wider text-primary-foreground/70">
                Features
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  {
                    icon: GraduationCap,
                    title: "Students & Admissions",
                    description:
                      "Enrollment, student records & admissions lifecycle.",
                  },
                  {
                    icon: BookOpen,
                    title: "Academics & Timetable",
                    description:
                      "Sessions, classes, sections, subjects & period scheduling.",
                  },
                  {
                    icon: ClipboardCheck,
                    title: "Exams, Marks & Results",
                    description:
                      "Exam types, schedules, mark entry & auto PASS/FAIL results.",
                  },
                  {
                    icon: CalendarDays,
                    title: "Attendance",
                    description:
                      "Period-wise attendance tracking by class & section.",
                  },
                  {
                    icon: Users,
                    title: "Employees & HR",
                    description:
                      "Staff directory, designations & workload assignments.",
                  },

                  {
                    icon: School,
                    title: "Certificates & More",
                    description:
                      "Report cards, certificates, events & announcements.",
                  },
                ].map(({ icon: Icon, title, description }) => (
                  <div
                    key={title}
                    className="flex items-start gap-3 rounded-lg border border-primary-foreground/15 bg-white/5 p-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10">
                      <Icon className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-xs font-bold">{title}</p>
                      <p className="mt-0.5 text-[10px] leading-4 text-primary-foreground/70">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-primary-foreground/60">
            © {new Date().getFullYear()} PrismaEd+
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
                  <h1 className="font-bold">PrismaEd+</h1>
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
                <label htmlFor="username" className="text-sm font-medium">
                  Username
                </label>

                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={identifier}
                    onChange={(event) =>
                      setIdentifier(
                        onlyUsername(event.target.value, LIMITS.USERNAME_MAX),
                      )
                    }
                    className="pl-10"
                    autoComplete="username"
                    maxLength={LIMITS.USERNAME_MAX}
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
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
                    onChange={(event) =>
                      setPassword(event.target.value.slice(0, LIMITS.TEXT_MAX))
                    }
                    className="pl-10 pr-10"
                    autoComplete="current-password"
                    maxLength={LIMITS.TEXT_MAX}
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
