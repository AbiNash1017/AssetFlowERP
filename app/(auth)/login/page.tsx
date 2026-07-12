"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { loginSchema } from "@/lib/validations/auth";
import { THEME } from "@/lib/constants/styles";
import { toast } from "sonner";
import { KeyRound, Mail, ArrowRight, ShieldCheck, Eye, EyeOff, Loader2, Shield, Briefcase, Users, User } from "lucide-react";

const DEMO_ROLES = [
  {
    label: "Admin",
    email: "demo.admin@assetflow.dev",
    password: "Demo@Admin123",
    description: "Full system access",
    icon: Shield,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800",
  },
  {
    label: "Asset Manager",
    email: "demo.manager@assetflow.dev",
    password: "Demo@Manager123",
    description: "Manage assets & allocations",
    icon: Briefcase,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
  },
  {
    label: "Dept Head",
    email: "demo.head@assetflow.dev",
    password: "Demo@Head123",
    description: "Department oversight",
    icon: Users,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
  },
  {
    label: "Employee",
    email: "demo.employee@assetflow.dev",
    password: "Demo@Employee123",
    description: "Request & track assets",
    icon: User,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
  },
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const fieldErrors: typeof errors = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await signIn.email({ email, password, callbackURL: callbackUrl });
      if (response?.error) {
        toast.error(response.error.message || "Failed to sign in. Please try again.");
      } else {
        toast.success("Welcome back! Redirecting...");
        router.refresh();
        router.push(callbackUrl);
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: (typeof DEMO_ROLES)[0]) => {
    setDemoLoading(role.label);
    try {
      const response = await signIn.email({
        email: role.email,
        password: role.password,
        callbackURL: "/",
      });
      if (response?.error) {
        toast.error(response.error.message || "Demo login failed.");
      } else {
        toast.success(`Signed in as ${role.label} — welcome!`);
        router.refresh();
        router.push("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Demo login failed.");
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-background">
      {/* ── Left panel: Branding ── */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-primary px-6 py-12 text-white lg:w-1/2 xl:w-7/12 lg:px-12 lg:py-24">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-teal-brand/20 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur-md border border-white/20">
            <ShieldCheck className="h-6 w-6 text-secondary" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">AssetFlow</span>
        </div>

        <div className="relative z-10 my-auto max-w-lg space-y-6 py-12 lg:py-0">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl leading-tight">
            Streamline your <br />
            <span className="text-secondary">Enterprise Resources</span>
          </h1>
          <p className="text-lg text-white/80 leading-relaxed">
            Centralized tracking, real-time lifecycle status, conflict-free resource bookings, and streamlined maintenance management.
          </p>

          {/* Demo role preview */}
          <div className="hidden sm:block rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-4 space-y-3">
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Available demo roles →</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ROLES.map((role) => (
                <div key={role.label} className="flex items-center gap-2 text-sm text-white/80">
                  <role.icon className="h-3.5 w-3.5 text-secondary flex-shrink-0" />
                  <span>{role.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 pt-4 text-xs font-semibold text-white/60">
            {["Register Assets", "Allocate & Book", "Maintain & Audit"].map((step, i) => (
              <React.Fragment key={step}>
                {i > 0 && <div className="h-px w-8 bg-white/20" />}
                <div className="flex items-center gap-2">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full font-bold text-[10px] ${i === 0 ? "bg-secondary text-white" : "bg-white/10 border border-white/20 text-white"}`}>
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sm text-white/60">
          &copy; {new Date().getFullYear()} AssetFlow. All rights reserved.
        </div>
      </div>

      {/* ── Right panel: Login Form ── */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:w-1/2 xl:w-5/12 lg:px-20 xl:px-24 bg-card overflow-y-auto">
        <div className="mx-auto w-full max-w-sm space-y-6">

          {/* Header */}
          <div className="text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground">AssetFlow – login</h2>
            <div className="mt-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-muted text-lg font-bold text-muted-foreground shadow-sm">
                AF
              </div>
            </div>
          </div>

          {/* ── Demo Accounts Panel ── */}
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">Try a Demo Account</span>
              <span className="text-[10px] bg-primary/10 text-primary font-semibold rounded-full px-2 py-0.5">
                No signup needed
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Click any role to instantly access a pre-configured demo account.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ROLES.map((role) => {
                const Icon = role.icon;
                const loading = demoLoading === role.label;
                return (
                  <button
                    key={role.label}
                    type="button"
                    onClick={() => handleDemoLogin(role)}
                    disabled={!!demoLoading}
                    className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-sm active:scale-[0.98] ${role.bg}`}
                  >
                    {loading ? (
                      <Loader2 className={`h-4 w-4 mt-0.5 animate-spin flex-shrink-0 ${role.color}`} />
                    ) : (
                      <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${role.color}`} />
                    )}
                    <div className="min-w-0">
                      <div className={`text-xs font-bold truncate ${role.color}`}>{role.label}</div>
                      <div className="text-[10px] text-muted-foreground leading-tight">{role.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">or sign in with your account</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* ── Sign In Form ── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-foreground">Email</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${THEME.classes.input} pl-10 ${errors.email ? "border-destructive ring-1 ring-destructive" : ""}`}
                  placeholder="name@company.com"
                  disabled={isLoading}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-destructive font-medium">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-foreground">Password</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <KeyRound className="h-4 w-4" />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${THEME.classes.input} pl-10 pr-10 ${errors.password ? "border-destructive ring-1 ring-destructive" : ""}`}
                  placeholder="*********"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-destructive font-medium">{errors.password}</p>}
              <div className="flex justify-end mt-1.5">
                <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:text-primary/80">
                  Forgot password
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`${THEME.classes.btnPrimary} w-full flex items-center justify-center gap-2 py-2.5 mt-2`}
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /><span>Signing In...</span></>
              ) : (
                <><span>Sign In</span><ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <hr className="border-border" />

          <div className="space-y-3">
            <span className="block text-sm font-semibold text-foreground">New here?</span>
            <div className="rounded-xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
              Sign up creates an employee account — admin roles assigned later
            </div>
            <Link
              href="/signup"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border bg-card text-foreground font-semibold hover:bg-accent hover:text-accent-foreground transition-all duration-150"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
