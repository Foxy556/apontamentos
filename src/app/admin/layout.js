import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';

export default async function AdminLayout({ children }) {
  // Double-barrier security check (Server-Side)
  // Even if middleware is somehow bypassed, the page won't render without a valid JWT.
  
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;

  if (!token) {
    redirect('/');
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
  } catch (error) {
    redirect('/');
  }

  return <>{children}</>;
}
