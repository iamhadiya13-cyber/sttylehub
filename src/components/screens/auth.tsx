"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Lock, Mail, User } from "lucide-react";
import { forgotPasswordStepOneSchema, forgotPasswordStepTwoSchema, loginFormSchema, registerFormSchema } from "@/lib/client-schemas";
import { Button, Field, PageShell, TextInput } from "@/components/screens/shared";
import LoadingButton from "@/components/ui/LoadingButton";
import { useVerifiedSessionState } from "@/hooks/useVerifiedSessionState";

function AuthSplitLayout({ heading, tagline, title, subtitle, children, sideAccent = "#818CF8" }: { heading: string; tagline: string; title: string; subtitle: string; children: React.ReactNode; sideAccent?: string }) {
  return (
    <div className="grid min-h-screen bg-[#0A0A0A] text-white lg:grid-cols-2">
      <section className="relative order-2 overflow-hidden px-6 py-12 lg:order-1 lg:px-12 lg:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,245,0,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,69,0,0.12),transparent_30%)]" />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative mx-auto flex h-full max-w-xl flex-col justify-center gap-6">
          <span className="inline-flex w-fit rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">StyleHub Members</span>
          <h1 className="text-5xl font-black uppercase leading-none sm:text-6xl xl:text-7xl" style={{ color: sideAccent }}>{heading}</h1>
          <p className="max-w-md text-base leading-7 text-[#A0A0A0] sm:text-lg">{tagline}</p>
        </motion.div>
      </section>
      <section className="order-1 flex items-center justify-center px-4 py-10 lg:order-2 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-[28px] border border-[#1F1F1F] bg-[#111111] p-6 shadow-2xl sm:p-8">
          <div className="mb-8 space-y-2">
            <h2 className="text-3xl font-bold">{title}</h2>
            <p className="text-sm text-[#888888]">{subtitle}</p>
          </div>
          {children}
        </motion.div>
      </section>
    </div>
  );
}

export function LoginPageScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const callbackUrl = searchParams?.get("callbackUrl") || "/";
  const reason = searchParams?.get("reason");
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);
  const googleEnabled = Boolean(process.env.NEXT_PUBLIC_GOOGLE_ENABLED);

  const form = useForm({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [router, status]);

  useEffect(() => {
    if (reason === "session_expired") {
      toast("Your session expired. Please sign in again.", { id: "session-expired" });
    }
  }, [reason]);

  if (status === "loading") {
    return (
      <PageShell hideFooter>
        <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-10">
          <div className="h-14 w-14 animate-pulse rounded-full bg-[#1A1A1A]" />
        </main>
      </PageShell>
    );
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const response = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
      callbackUrl,
    });

    if (response?.error) {
      setShake(true);
      if (response.error.includes("Please verify your email first")) {
        toast.error("Please verify your email first");
        await fetch("/api/auth/resend-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: values.email }),
        }).catch(() => undefined);
        router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
      } else {
        toast.error(response.error);
      }
      window.setTimeout(() => setShake(false), 400);
      return;
    }

    toast.success("Signed in successfully");
    router.push(response?.url || callbackUrl);
    router.refresh();
  });

  return (
    <AuthSplitLayout heading="WELCOME BACK." tagline="Premium drops, fast checkout, and your full StyleHub world waiting where you left it." title="Sign In" subtitle="Enter your credentials to continue" sideAccent="#FFFFFF">
      <motion.form animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }} onSubmit={onSubmit} className="space-y-5">
        <Field label="Email address" error={form.formState.errors.email?.message} icon={<Mail className="h-4 w-4" />}>
          <TextInput type="email" placeholder="you@example.com" {...form.register("email")} />
        </Field>
      <Field label="Password" error={form.formState.errors.password?.message} icon={<Lock className="h-4 w-4" />} right={<Link href="/forgot-password" className="text-xs text-[#888888] hover:text-[#A5B4FC]">Forgot password?</Link>}>
          <TextInput type={showPassword ? "text" : "password"} placeholder="••••••••" {...form.register("password")} className="pr-12" />
          <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#888888]">{showPassword ? "Hide" : "Show"}</button>
        </Field>
        <Button type="submit" loading={form.formState.isSubmitting} loadingText="Signing in..." className="w-full">Sign In</Button>
        <div className="relative py-2 text-center text-sm text-[#666666]">
          <span className="relative z-10 bg-[#111111] px-4">or</span>
          <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#1F1F1F]" />
        </div>
        {googleEnabled ? <Button type="button" variant="secondary" onClick={() => void signIn("google", { callbackUrl })} className="w-full">Continue with Google</Button> : null}
      <p className="text-center text-sm text-[#888888]">Don&apos;t have an account? <Link href="/register" className="font-semibold text-white hover:text-[#A5B4FC]">Create one</Link></p>
      </motion.form>
    </AuthSplitLayout>
  );
}

export function RegisterPageScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const form = useForm({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", terms: false },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name, email: values.email, password: values.password }),
      });
      const json = (await response.json()) as { success: boolean; message?: string };
      if (!response.ok || !json.success) throw new Error(json.message || "Failed to create account");
      const signInResponse = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
        callbackUrl: `/verify-email?email=${encodeURIComponent(values.email)}`,
      });
      if (signInResponse?.error) {
        throw new Error(signInResponse.error);
      }
      toast.success(json.message || "Check your email to verify your account");
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create account");
    }
  });

  return (
    <AuthSplitLayout heading="JOIN THE CULTURE." tagline="Create your StyleHub account to unlock exclusive drops, fast reorders, and a better way to shop streetwear." title="Create Account" subtitle="Build your StyleHub profile in under a minute">
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Full Name" error={form.formState.errors.name?.message} icon={<User className="h-4 w-4" />}>
          <TextInput placeholder="Your full name" {...form.register("name")} />
        </Field>
        <Field label="Email address" error={form.formState.errors.email?.message} icon={<Mail className="h-4 w-4" />}>
          <TextInput type="email" placeholder="you@example.com" {...form.register("email")} />
        </Field>
        <Field label="Password" error={form.formState.errors.password?.message} icon={<Lock className="h-4 w-4" />}>
          <TextInput type={showPassword ? "text" : "password"} placeholder="Minimum 8 characters" {...form.register("password")} className="pr-12" />
          <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#888888]">{showPassword ? "Hide" : "Show"}</button>
        </Field>
        <Field label="Confirm Password" error={form.formState.errors.confirmPassword?.message} icon={<Lock className="h-4 w-4" />}>
          <TextInput type={showConfirmPassword ? "text" : "password"} placeholder="Repeat password" {...form.register("confirmPassword")} className="pr-12" />
          <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#888888]">{showConfirmPassword ? "Hide" : "Show"}</button>
        </Field>
        <label className="flex items-start gap-3 rounded-xl border border-[#1F1F1F] bg-black/20 p-4 text-sm text-[#BDBDBD]">
            <input type="checkbox" {...form.register("terms")} className="mt-1 h-4 w-4 accent-[#6366F1]" />
          <span>I agree to the Terms & Privacy Policy</span>
        </label>
        {form.formState.errors.terms?.message ? <p className="text-xs text-[#FF7A5C]">{form.formState.errors.terms.message}</p> : null}
        <Button type="submit" loading={form.formState.isSubmitting} loadingText="Creating account..." className="w-full">Create Account</Button>
      <p className="text-center text-sm text-[#888888]">Already have an account? <Link href="/login" className="font-semibold text-white hover:text-[#A5B4FC]">Sign in</Link></p>
      </form>
    </AuthSplitLayout>
  );
}

export function VerifyEmailPageScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update, resolvedIsVerified } = useVerifiedSessionState();
  const email = searchParams?.get("email") || "";
  const activeEmail = session?.user?.email || email;
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setTimeout(() => setSeconds((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace(`/login?callbackUrl=${encodeURIComponent(`/verify-email?email=${email}`)}`);
      return;
    }
    if (resolvedIsVerified) {
      router.replace("/profile");
    }
  }, [email, resolvedIsVerified, router, status]);

  const handleChange = (index: number, value: string) => {
    const next = value.replace(/\D/g, "").slice(-1);
    setOtp((current) => {
      const updated = [...current];
      updated[index] = next;
      return updated;
    });
    if (next && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    if (!pasted.length) return;
    setOtp([...pasted, ...Array(6 - pasted.length).fill("")].slice(0, 6));
  };

  const verifyOtp = async () => {
    try {
      setSubmitting(true);
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: activeEmail, otp: otp.join("") }),
      });
      const json = (await response.json()) as { success: boolean; message?: string };
      if (!response.ok || !json.success) throw new Error(json.message || "Verification failed");
      await update({ isVerified: true });
      toast.success("Email verified! Welcome to StyleHub");
      window.setTimeout(() => router.push("/profile"), 900);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  const resendOtp = async () => {
    try {
      if (resending || seconds > 0) return;
      setResending(true);
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: activeEmail }),
      });
      const json = (await response.json()) as { success: boolean; message?: string; data?: { cooldownSeconds?: number }; retryAfterSeconds?: number };
      if (!response.ok || !json.success) {
        if (json.message === "Email already verified") {
          await update({ isVerified: true });
          router.replace("/profile");
          return;
        }
        if (response.status === 429) {
          setSeconds(json.retryAfterSeconds || 60);
        }
        throw new Error(json.message || "Failed to resend code");
      }
      toast.success(json.message || "Verification code resent");
      setSeconds(json.data?.cooldownSeconds || 60);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  if (status === "loading") {
    return (
      <PageShell hideFooter>
        <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-10">
          <div className="h-14 w-14 animate-pulse rounded-full bg-[#1A1A1A]" />
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell hideFooter>
      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-[480px] rounded-[28px] border border-[#1F1F1F] bg-[#111111] p-8 text-white">
          <h1 className="text-3xl font-bold">Verify Your Email</h1>
          <p className="mt-2 text-sm text-[#888888]">We sent a 6-digit code to {activeEmail || "your email"}.</p>
          <div className="mt-8 space-y-6" onPaste={handlePaste}>
            <div className="grid grid-cols-6 gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    inputRefs.current[index] = element;
                  }}
                  value={digit}
                  onChange={(event) => handleChange(index, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  maxLength={1}
                className="h-[60px] rounded-lg border-2 border-[#2A2A2A] bg-[#111111] text-center text-2xl font-bold text-white outline-none transition focus:border-[#6366F1]"
                />
              ))}
            </div>
            <Button type="button" disabled={otp.some((digit) => !digit)} loading={submitting} loadingText="Verifying..." onClick={() => void verifyOtp()} className="w-full">Verify</Button>
            <div className="text-center text-sm text-[#888888]">
              Didn&apos;t receive the code?{" "}
              {seconds > 0 ? (
                <span>Resend in {seconds}s</span>
              ) : (
            <LoadingButton type="button" loading={resending} loadingText="Sending..." onClick={() => void resendOtp()} className="font-semibold text-[#A5B4FC] disabled:opacity-50" style={{ background: "transparent", border: "none", color: "#A5B4FC", padding: 0, fontWeight: 600 }}>
              Resend OTP
            </LoadingButton>
              )}
            </div>
          </div>
        </div>
      </main>
    </PageShell>
  );
}

export function ForgotPasswordPageScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const emailForm = useForm({
    resolver: zodResolver(forgotPasswordStepOneSchema),
    defaultValues: { email: "" },
  });
  const resetForm = useForm({
    resolver: zodResolver(forgotPasswordStepTwoSchema),
    defaultValues: { otp: "", newPassword: "", confirmPassword: "" },
  });

  const submitEmail = emailForm.handleSubmit(async (values) => {
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = (await response.json()) as { success: boolean; message?: string };
      if (!response.ok || !json.success) throw new Error(json.message || "Failed to send OTP");
      setEmail(values.email);
      setStep(2);
      toast.success(json.message || "OTP sent to your email");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send OTP");
    }
  });

  const handleOtpChange = (index: number, value: string) => {
    const next = value.replace(/\D/g, "").slice(-1);
    setOtpDigits((current) => {
      const updated = [...current];
      updated[index] = next;
      resetForm.setValue("otp", updated.join(""));
      return updated;
    });
    if (next && index < otpRefs.current.length - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const submitReset = resetForm.handleSubmit(async (values) => {
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpDigits.join(""), newPassword: values.newPassword }),
      });
      const json = (await response.json()) as { success: boolean; message?: string };
      if (!response.ok || !json.success) throw new Error(json.message || "Failed to reset password");
      toast.success(json.message || "Password updated. Please login.");
      router.push("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reset password");
    }
  });

  return (
    <PageShell hideFooter>
      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[420px] rounded-[28px] border border-[#1F1F1F] bg-[#111111] p-6 sm:p-8">
          {step === 1 ? (
            <form onSubmit={submitEmail} className="space-y-5">
              <div>
                <h1 className="text-3xl font-bold">Forgot Password</h1>
                <p className="mt-2 text-sm text-[#888888]">We&apos;ll send a 6-digit OTP to your email.</p>
              </div>
              <Field label="Email address" error={emailForm.formState.errors.email?.message} icon={<Mail className="h-4 w-4" />}>
                <TextInput type="email" placeholder="you@example.com" {...emailForm.register("email")} />
              </Field>
              <Button type="submit" loading={emailForm.formState.isSubmitting} loadingText="Sending reset link..." className="w-full">Send OTP</Button>
            </form>
          ) : (
            <form onSubmit={submitReset} className="space-y-5">
              <div>
                <h1 className="text-3xl font-bold">Reset Password</h1>
                <p className="mt-2 text-sm text-[#888888]">Enter the OTP sent to {email} and choose a new password.</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-white">OTP</p>
                <div className="grid grid-cols-6 gap-2">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        otpRefs.current[index] = element;
                      }}
                      value={digit}
                      onChange={(event) => handleOtpChange(index, event.target.value)}
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                className="h-12 rounded-lg border border-[#1F1F1F] bg-[#111111] text-center text-lg text-white outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/30"
                      inputMode="numeric"
                      maxLength={1}
                    />
                  ))}
                </div>
              </div>
              <Field label="New Password" error={resetForm.formState.errors.newPassword?.message} icon={<Lock className="h-4 w-4" />}>
                <TextInput type="password" placeholder="New password" {...resetForm.register("newPassword")} />
              </Field>
              <Field label="Confirm Password" error={resetForm.formState.errors.confirmPassword?.message} icon={<Lock className="h-4 w-4" />}>
                <TextInput type="password" placeholder="Confirm password" {...resetForm.register("confirmPassword")} />
              </Field>
              <Button type="submit" loading={resetForm.formState.isSubmitting} loadingText="Resetting..." className="w-full">Reset Password</Button>
            </form>
          )}
        </motion.div>
      </main>
    </PageShell>
  );
}
