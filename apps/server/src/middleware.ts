import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/server-common/config";

export function middleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers["authorization"] ?? "";

  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.status(401).json({ message: "Unauthorized" });
    }
    // @ts-ignore
    req.userId = user.userId;
    next();
  });
}
