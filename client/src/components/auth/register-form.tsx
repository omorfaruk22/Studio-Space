"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/loading";
import { FormDivider } from "@/components/auth/auth-shell";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { authClient } from "@/lib/auth-client";
import { registerSchema, type RegisterValues } from "@/lib/auth-schemas";

export function RegisterForm() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", image: "", password: "" },
  });

  const onSubmit = handleSubmit(async ({ name, email, image, password }) => {
    try {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
        ...(image ? { image } : {}),
        callbackURL: "/",
      });

      if (result.error) {
        toast.error(result.error.message || "We could not create your account.");
        return;
      }

      let signedOut = false;
      try {
        const signOutResult = await authClient.signOut();
        signedOut = !signOutResult.error;
      } catch {
        signedOut = false;
      }

      if (signedOut) {
        toast.success("Your account is ready. Please log in.");
      } else {
        toast.message("Your account is ready. Log out, then log in to continue.");
      }
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Could not connect to the authentication server.");
    }
  });

  return (
    <>
      <form onSubmit={onSubmit} noValidate aria-busy={isSubmitting} className="space-y-4">
        <FormField label="Full name" htmlFor="name" required error={errors.name?.message}>
          <Input id="name" autoComplete="name" placeholder="Your name" aria-invalid={Boolean(errors.name)} {...register("name")} />
        </FormField>
        <FormField label="Email address" htmlFor="email" required error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={Boolean(errors.email)} {...register("email")} />
        </FormField>
        <FormField label="Photo URL" htmlFor="image" hint="Optional. Use a publicly accessible image URL." error={errors.image?.message}>
          <Input id="image" type="url" autoComplete="url" placeholder="https://example.com/photo.jpg" aria-invalid={Boolean(errors.image)} {...register("image")} />
        </FormField>
        <FormField label="Password" htmlFor="password" required hint="At least 6 characters with uppercase and lowercase letters." error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="new-password" placeholder="Create a password" aria-invalid={Boolean(errors.password)} {...register("password")} />
        </FormField>
        <Button type="submit" size="lg" className="mt-2 w-full" disabled={isSubmitting}>
          {isSubmitting ? <><Spinner className="size-4" label="Creating account" />Creating your account…</> : "Create account"}
        </Button>
      </form>
      <FormDivider />
      <GoogleSignInButton />
      <p className="mt-7 text-center text-sm text-muted">
        Already have an account? <Link className="font-semibold text-brand-strong hover:underline" href="/login">Log in</Link>
      </p>
    </>
  );
}
