"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { THEME } from "@/lib/constants/styles";
import { toast } from "sonner";
import { KeyRound, Eye, EyeOff, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};

    if (password.length < 8) errs.password = "Password must be at least 8 characters.";
    if (password !== confirmPassword) errs.confirm = "Passwords do not match.";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});

    if (!token) {
      toast.error("Invalid or missing reset token. Please request a new link.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (res?.error) {
        toast.error(res.error.message || "Failed to reset password. The link may have expired.");
      } else {
        setIsDone(true);
        toast.success("Password reset successfully!");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-background">
      {/* Left Panel: Branding */}
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
            Set a New <br />
            <span className="text-secondary">Secure Password</span>
          </h1>
          <p className="text-lg text-white/80 leading-relaxed">
            Choose a strong password you haven't used before. Your account will be secured immediately after reset.
          </p>
        </div>

        <div className="relative z-10 text-sm text-white/60">
          &copy; {new Date().getFullYear()} AssetFlow. All rights reserved.
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:w-1/2 xl:w-5/12 lg:px-20 xl:px-24 bg-card">
        <div className="mx-auto w-full max-w-sm space-y-6">
          <div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 mb-6"
            >
              ← Back to sign in
            </Link>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Reset Password</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter and confirm your new password below.
            </p>
          </div>

          {isDone ? (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-6 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <span className="font-bold text-foreground text-base">Password Updated!</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your password has been reset successfully. You can now sign in with your new credentials.
              </p>
              <button
                onClick={() => router.push("/login")}
                className={`${THEME.classes.btnPrimary} w-full flex items-center justify-center gap-2 py-2.5 mt-2`}
              >
                Go to Sign In
              </button>
            </div>
          ) : !token ? (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-6 space-y-3 animate-in fade-in duration-300">
              <span className="font-bold text-foreground text-base">Invalid Reset Link</span>
              <p className="text-sm text-muted-foreground">
                This link is invalid or has expired. Please request a new password reset link.
              </p>
              <Link
                href="/forgot-password"
                className={`${THEME.classes.btnPrimary} w-full flex items-center justify-center gap-2 py-2.5 mt-2`}
              >
                Request New Link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div>
                <label htmlFor="password" className={THEME.classes.label}>
                  New Password
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    <KeyRound className="h-4 w-4" />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${THEME.classes.input} pl-10 pr-10 ${errors.password ? "border-destructive ring-1 ring-destructive" : ""}`}
                    placeholder="Min. 8 characters"
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
                  <p className="mt-1.5 text-xs text-destructive font-medium">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm" className={THEME.classes.label}>
                  Confirm Password
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    <KeyRound className="h-4 w-4" />
                  </span>
                  <input
                    id="confirm"
                    name="confirm"
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${THEME.classes.input} pl-10 pr-10 ${errors.confirm ? "border-destructive ring-1 ring-destructive" : ""}`}
                    placeholder="Repeat your new password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirm && (
                  <p className="mt-1.5 text-xs text-destructive font-medium">{errors.confirm}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`${THEME.classes.btnPrimary} w-full flex items-center justify-center gap-2 py-2.5`}
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /><span>Resetting...</span></>
                ) : (
                  <span>Reset Password</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
