import { cookies } from 'next/headers';

export interface Session {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    organizationId: string;
    organizationSlug: string;
    role: string;
    permissions: string[];
    locale: string;
    timezone: string;
  };
  accessToken: string;
}

export async function getServerSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionData = cookieStore.get('session')?.value;
  if (!sessionData) return null;

  try {
    return JSON.parse(atob(sessionData)) as Session;
  } catch {
    return null;
  }
}
