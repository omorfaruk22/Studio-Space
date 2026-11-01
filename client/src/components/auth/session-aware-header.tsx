"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { authClient } from "@/lib/auth-client";

export function SessionAwareHeader() {
  const router = useRouter();
  const { data } = authClient.useSession();

  async function logout() {
    const result = await authClient.signOut();
    if (result.error) {
      toast.error("We could not sign you out. Please try again.");
      return;
    }
    toast.success("You have been logged out.");
    router.push("/");
    router.refresh();
  }

  const user = data?.user
    ? { name: data.user.name, email: data.user.email, image: data.user.image, onLogout: logout }
    : null;

  return <SiteHeader user={user} />;
}
