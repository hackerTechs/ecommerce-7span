import dotenv from "dotenv";

dotenv.config();

const accessSecret =
  process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "fallback-access-secret";
const refreshSecret =
  process.env.JWT_REFRESH_SECRET || `${accessSecret}-refresh`;

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  jwt: {
    accessSecret,
    refreshSecret,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  database: {
    url: process.env.DATABASE_URL || "",
  },
  redis: {
    url: process.env.REDIS_URL || "",
  },
} as const;
