"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { loginSchema } from "@/lib/validations/auth";
import { THEME } from "@/lib/constants/styles";
import { toast } from "sonner";
import { KeyRound, Mail, ArrowRight, ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Validate using Zod
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
      const response = await signIn.email({
        email,
        password,
        callbackURL: callbackUrl,
      });

      if (response?.error) {
        toast.error(response.error.message || "Failed to sign in. Please try again.");
      } else {
        toast.success("Welcome back! Redirecting...");
        router.refresh();
        router.push(callbackUrl);
      }
    } catch (err: any) {
      console.error("Sign in error:", err);
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-background">
      {/* Left panel: Decorative / Branding */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-primary px-6 py-12 text-white lg:w-1/2 xl:w-7/12 lg:px-12 lg:py-24">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Glow effect */}
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-secondary/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-teal-brand/20 blur-3xl"></div>

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
          
          {/* Decorative steps to align with the progress theme from image */}
          <div className="hidden sm:flex items-center gap-4 pt-4 text-xs font-semibold text-white/60">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-white font-bold text-[10px]">1</span>
              <span>Register Assets</span>
            </div>
            <div className="h-px w-8 bg-white/20"></div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white font-bold text-[10px]">2</span>
              <span>Allocate & Book</span>
            </div>
            <div className="h-px w-8 bg-white/20"></div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white font-bold text-[10px]">3</span>
              <span>Maintain & Audit</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-white/60">
          &copy; {new Date().getFullYear()} AssetFlow. All rights reserved.
        </div>
      </div>

      {/* Right panel: Login Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:w-1/2 xl:w-5/12 lg:px-20 xl:px-24 bg-card">
        <div className="mx-auto w-full max-w-sm">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Sign In</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              New to AssetFlow?{" "}
              <Link href="/signup" className="font-semibold text-primary hover:text-primary/80 underline decoration-2 underline-offset-4">
                Create an employee account
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className={THEME.classes.label}>
                  Email Address
                </label>
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
                    placeholder="you@company.com"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-destructive font-medium flex items-center gap-1">
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className={THEME.classes.label}>
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-primary hover:text-primary/80"
                  >
                    Forgot password?
                  </Link>
                </div>
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
                    placeholder="••••••••"
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
                {errors.password && (
                  <p className="mt-1.5 text-xs text-destructive font-medium flex items-center gap-1">
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`${THEME.classes.btnPrimary} w-full flex items-center justify-center gap-2 py-2.5`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-border">
              <div className="rounded-lg bg-muted p-4 text-xs text-muted-foreground border border-border/50">
                <span className="font-semibold text-foreground block mb-1">💡 Demo Accounts Notice</span>
                The organization administrator promotes users and assigns role-based permissions (Department Head, Asset Manager, Admin) inside the employee directory.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
