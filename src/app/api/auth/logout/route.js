import { NextResponse } from 'next/server';

export async function POST(request) {
  const response = NextResponse.json({ success: true });
  
  // Clear the cookies by setting them with maxAge 0
  response.cookies.set({
    name: 'admin_session',
    value: '',
    httpOnly: true,
    expires: new Date(0),
    path: '/'
  });

  response.cookies.set({
    name: 'public_session',
    value: '',
    httpOnly: true,
    expires: new Date(0),
    path: '/'
  });

  return response;
}
