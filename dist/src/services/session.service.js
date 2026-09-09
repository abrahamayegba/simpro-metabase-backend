"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSession = createSession;
exports.findSessionById = findSessionById;
exports.findSessionByUser = findSessionByUser;
exports.revokeSession = revokeSession;
exports.deleteSession = deleteSession;
// src/services/session.service.ts
const prisma_1 = require("../lib/prisma");
const bcrypt_1 = require("bcrypt");
const REFRESH_SALT_ROUNDS = 12;
async function createSession(userId, refreshToken, userAgent, ip) {
    const refreshTokenHash = await (0, bcrypt_1.hash)(refreshToken, REFRESH_SALT_ROUNDS);
    const session = await prisma_1.prisma.session.create({
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
async function findSessionById(sessionId) {
    return prisma_1.prisma.session.findUnique({ where: { id: sessionId } });
}
async function findSessionByUser(userId) {
    return prisma_1.prisma.session.findMany({ where: { userId, revoked: false } });
}
async function revokeSession(sessionId) {
    return prisma_1.prisma.session.update({
        where: { id: sessionId },
        data: { revoked: true },
    });
}
async function deleteSession(sessionId) {
    return prisma_1.prisma.session.delete({ where: { id: sessionId } });
}
