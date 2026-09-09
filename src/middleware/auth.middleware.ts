import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthRequest extends Request {
  user?: { sub: string; email: string };
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
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

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
      sub: string;
      email: string;
    };

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
