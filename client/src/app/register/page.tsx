import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell eyebrow="Make yourself at home" title="Create an account" description="Join a community built around creative spaces and good work.">
      <RegisterForm />
    </AuthShell>
  );
}
