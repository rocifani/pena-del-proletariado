import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import { createSupabaseServerReadOnly } from "@/lib/supabase/server-readonly";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerReadOnly();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El middleware ya redirige, pero lo repetimos por las dudas.
  if (!user) redirect("/login");

  return <AdminShell userEmail={user.email ?? ""}>{children}</AdminShell>;
}
