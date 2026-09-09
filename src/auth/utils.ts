import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}
export async function comparePassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export type AccessTokenPayload = { sub: string; email: string };
export type RefreshTokenPayload = AccessTokenPayload & { jti: string };

export function signAccessToken(userId: string, email: string) {
  const payload: AccessTokenPayload = { sub: userId, email };

  return jwt.sign(
    payload as object,
    process.env.JWT_ACCESS_SECRET as string,
    {
      expiresIn: process.env.ACCESS_TOKEN_TTL || "15m",
    } as SignOptions
  );
}

export function signRefreshToken(userId: string, email: string, jti: string) {
  const payload: RefreshTokenPayload = { sub: userId, email, jti };

  return jwt.sign(
    payload as object,
    process.env.JWT_REFRESH_SECRET as string,
    {
      expiresIn: `${process.env.REFRESH_TOKEN_TTL_DAYS || 14}d`,
    } as SignOptions
  );
}

export function verifyAccessToken(token: string) {
  return jwt.verify(
    token,
    process.env.JWT_ACCESS_SECRET as string
  ) as AccessTokenPayload & JwtPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET as string
  ) as RefreshTokenPayload & JwtPayload;
}
