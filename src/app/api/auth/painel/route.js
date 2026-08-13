import { NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

// POST - Login
export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    let publicUsers = {};
    try {
      publicUsers = JSON.parse(process.env.PUBLIC_USERS || '{}');
    } catch (e) {
      console.error('Failed to parse PUBLIC_USERS env variable');
    }

    const user = publicUsers[username];

    // Support both old format (string password) and new format (object with senha/role)
    let isValid = false;
    let role = 'visualizar';

    if (user) {
      if (typeof user === 'string') {
        // Old format: {"user": "password"}
        isValid = user === password;
        role = 'visualizar';
      } else if (user.senha) {
        // New format: {"user": {"senha": "...", "role": "..."}}
        isValid = user.senha === password;
        role = user.role || 'visualizar';
      }
    }

    if (isValid) {
      const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);
      const token = await new SignJWT({ role, username })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(jwtSecret);

      const response = NextResponse.json({ success: true, role });

      response.cookies.set({
        name: 'public_session',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24
      });

      return response;
    } else {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });

  response.cookies.set({
    name: 'public_session',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
  });

  return response;
}

// GET - Verificar autenticação e retornar role
export async function GET(request) {
  try {
    const cookie = request.cookies.get('public_session');

    if (!cookie?.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(cookie.value, jwtSecret);

    return NextResponse.json({
      authenticated: true,
      username: payload.username,
      role: payload.role,
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
