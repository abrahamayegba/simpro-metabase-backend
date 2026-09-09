"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authenticate(req, res, next) {
    try {
        // Try getting token from cookie first
        const tokenFromCookie = req.cookies?.accessToken;
        // Fall back to Authorization header
        const tokenFromHeader = req.headers.authorization?.startsWith("Bearer ")
            ? req.headers.authorization.split(" ")[1]
            : null;
        const token = tokenFromCookie || tokenFromHeader;
        if (!token) {
            return res.status(401).json({ message: "Missing token" });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Unauthorized" });
    }
}
