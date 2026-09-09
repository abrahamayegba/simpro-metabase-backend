"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);
async function hashPassword(plain) {
    return bcrypt_1.default.hash(plain, SALT_ROUNDS);
}
async function comparePassword(plain, hash) {
    return bcrypt_1.default.compare(plain, hash);
}
function signAccessToken(userId, email) {
    const payload = { sub: userId, email };
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_ACCESS_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_TTL || "15m",
    });
}
function signRefreshToken(userId, email, jti) {
    const payload = { sub: userId, email, jti };
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: `${process.env.REFRESH_TOKEN_TTL_DAYS || 14}d`,
    });
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET);
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET);
}
