// src/services/session.service.ts
import { prisma } from "../lib/prisma";
import { hash } from "bcrypt";

const REFRESH_SALT_ROUNDS = 12;

export async function createSession(
  userId: string,
  refreshToken: string,
  userAgent?: string,
  ip?: string
) {
  const refreshTokenHash = await hash(refreshToken, REFRESH_SALT_ROUNDS);

  const session = await prisma.session.create({
    data: {
      userId,
      refreshTokenHash,
      userAgent,
      ip,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14), // 14 days
    },
  });

  return session;
}

export async function findSessionById(sessionId: string) {
  return prisma.session.findUnique({ where: { id: sessionId } });
}

export async function findSessionByUser(userId: string) {
  return prisma.session.findMany({ where: { userId, revoked: false } });
}

export async function revokeSession(sessionId: string) {
  return prisma.session.update({
    where: { id: sessionId },
    data: { revoked: true },
  });
}

export async function deleteSession(sessionId: string) {
  return prisma.session.delete({ where: { id: sessionId } });
}
