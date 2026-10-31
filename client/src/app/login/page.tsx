import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell eyebrow="Welcome back" title="Log in" description="Sign in to manage the spaces and projects you care about.">
      <LoginForm />
    </AuthShell>
  );
}
