import PublicShell from "@/components/PublicShell";
import { createSupabaseServerReadOnly } from "@/lib/supabase/server-readonly";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerReadOnly();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <PublicShell isAdmin={!!user}>{children}</PublicShell>;
}
