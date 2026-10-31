"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { FormDivider } from "@/components/auth/auth-shell";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { authClient } from "@/lib/auth-client";
import { loginSchema, type LoginValues } from "@/lib/auth-schemas";

export function LoginForm() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    try {
      const result = await authClient.signIn.email({ email, password, callbackURL: "/" });

      if (result.error) {
        toast.error(result.error.message || "Email or password was not accepted.");
        return;
      }

      toast.success("Welcome back to StudioSpace.");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Could not connect to the authentication server.");
    }
  });

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormField label="Email address" htmlFor="email" required error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={Boolean(errors.email)} {...register("email")} />
        </FormField>
        <FormField label="Password" htmlFor="password" required error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="current-password" placeholder="Your password" aria-invalid={Boolean(errors.password)} {...register("password")} />
        </FormField>
        <div className="-mt-2 text-right">
          <span className="text-xs font-medium text-muted" title="Password reset is not part of this phase">Forgot password?</span>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Logging you in…" : "Log in"}
        </Button>
      </form>
      <FormDivider />
      <GoogleSignInButton />
      <p className="mt-7 text-center text-sm text-muted">
        New to StudioSpace? <Link className="font-semibold text-brand-strong hover:underline" href="/register">Create an account</Link>
      </p>
    </>
  );
}
