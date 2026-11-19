import type { User } from '@supabase/supabase-js';
import { requireSupabase } from '../lib/supabase';

/**
 * Verifies admin membership strictly against `public.admin_users` in PostgreSQL.
 * Regular authenticated users receive `false` automatically.
 */
export async function verifyAdminAccess(userId: string): Promise<boolean> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id, role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data?.user_id);
}

export async function signInAdmin(
  email: string,
  password: string
): Promise<{ user: User }> {
  const supabase = requireSupabase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error || !data.user) {
    throw new Error('بيانات تسجيل الدخول غير صحيحة أو تعذر التحقق من الحساب.');
  }

  const isAdmin = await verifyAdminAccess(data.user.id);
  if (!isAdmin) {
    await supabase.auth.signOut();
    throw new Error(
      'هذا الحساب لا يملك صلاحية الإدارة. تأكد من تشغيل ملف 03_seed_admin.sql في Supabase.'
    );
  }

  return { user: data.user };
}

export async function signOutAdmin(): Promise<void> {
  const supabase = requireSupabase();
  await supabase.auth.signOut();
}
