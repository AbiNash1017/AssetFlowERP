"use client";

import React, { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { THEME } from "@/lib/constants/styles";
import { toast } from "sonner";
import { Mail, ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      setIsLoading(false);
      return;
    }

    try {
      const response = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });

      if (response?.error) {
        setError(response.error.message || "Failed to initiate password reset.");
        toast.error(response.error.message || "Failed to initiate password reset.");
      } else {
        setIsSent(true);
        toast.success("Password reset instructions sent to your email!");
      }
    } catch (err: any) {
      console.error("Forgot password error:", err);
      setError(err.message || "An unexpected error occurred.");
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
            Recover <br />
            <span className="text-secondary">Your Account</span>
          </h1>
          <p className="text-lg text-white/80 leading-relaxed">
            Don't worry, it happens. Provide your registered corporate email and we will send you secure instructions to reset your account password.
          </p>
        </div>

        <div className="relative z-10 text-sm text-white/60">
          &copy; {new Date().getFullYear()} AssetFlow. All rights reserved.
        </div>
      </div>

      {/* Right panel: Forgot Password Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:w-1/2 xl:w-5/12 lg:px-20 xl:px-24 bg-card">
        <div className="mx-auto w-full max-w-sm">
          <div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 mb-6"
            >
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Reset Password</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your email and we'll send you recovery details.
            </p>
          </div>

          <div className="mt-8">
            {isSent ? (
              <div className="rounded-lg bg-teal-brand/10 p-6 text-sm text-teal-brand-foreground border border-teal-brand/20 space-y-3">
                <span className="font-bold block text-base">📩 Email Sent</span>
                <p>
                  We have dispatched password recovery instructions to <strong>{email}</strong>.
                </p>
                <p className="text-xs opacity-85">
                  Please check your spam folder if you do not receive the email in a few minutes.
                </p>
              </div>
            ) : (
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
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`${THEME.classes.input} pl-10 ${error ? "border-destructive ring-1 ring-destructive" : ""}`}
                      placeholder="you@company.com"
                      disabled={isLoading}
                    />
                  </div>
                  {error && (
                    <p className="mt-1.5 text-xs text-destructive font-medium">
                      <span>{error}</span>
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
                        <span>Sending Instructions...</span>
                      </>
                    ) : (
                      <span>Send Instructions</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
