import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import crypto from 'crypto';

/**
 * TOTP (Time-based One-Time Password) implementation
 * RFC 6238 compliant
 */

// Base32 decode
function base32Decode(encoded) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const char of encoded.toUpperCase()) {
    const val = alphabet.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
  }
  return Buffer.from(bytes);
}

// Generate TOTP code for a given time
function generateTOTP(secret, timeStep = 30, digits = 6) {
  const time = Math.floor(Date.now() / 1000 / timeStep);
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(time));

  const key = base32Decode(secret);
  const hmac = crypto.createHmac('sha1', key).update(timeBuffer).digest();

  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % Math.pow(10, digits);

  return code.toString().padStart(digits, '0');
}

// Verify TOTP code (allows ±1 time window for clock drift)
function verifyTOTP(code, secret) {
  if (!code || !secret) return false;
  if (!/^\d{6}$/.test(code)) return false;

  const timeStep = 30;

  // Check current and adjacent time windows
  for (let drift = -1; drift <= 1; drift++) {
    const time = Math.floor(Date.now() / 1000 / timeStep) + drift;
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeBigInt64BE(BigInt(time));

    const key = base32Decode(secret);
    const hmac = crypto.createHmac('sha1', key).update(timeBuffer).digest();

    const offset = hmac[hmac.length - 1] & 0x0f;
    const expected = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    ) % 1000000;

    if (code === expected.toString().padStart(6, '0')) {
      return true;
    }
  }

  return false;
}

export async function POST(request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Código é obrigatório' }, { status: 400 });
    }

    const secret = process.env.OTP_SECRET;

    if (!secret) {
      console.error('[Auth Verify] OTP_SECRET não configurado');
      return NextResponse.json({ error: 'Configuração OTP não encontrada' }, { status: 500 });
    }

    if (!verifyTOTP(code, secret)) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 401 });
    }

    // Create JWT session token for admin
    const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({ role: 'admin', username: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(jwtSecret);

    const response = NextResponse.json({ success: true });

    response.cookies.set({
      name: 'admin_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24
    });

    return response;
  } catch (error) {
    console.error('[Auth Verify] Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
