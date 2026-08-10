import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid token",
    });
  }
};