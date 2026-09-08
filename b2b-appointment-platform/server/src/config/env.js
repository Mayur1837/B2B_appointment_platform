import "dotenv/config";

export const env = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  platformTimezone: process.env.PLATFORM_TIMEZONE || "Asia/Kolkata",
};

if (!env.mongoUri || !env.jwtSecret)
  throw new Error("MONGO_URI and JWT_SECRET are required");
