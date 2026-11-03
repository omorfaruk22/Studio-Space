import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getCurrentSession } from "@/lib/server-session";

export default async function AdminPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/admin");

  return (
    <main className="mx-auto w-full max-w-page flex-1 px-5 py-10 sm:px-8 sm:py-14 xl:px-12">
      <AdminDashboard adminEmail={session.user.email} />
    </main>
  );
}
