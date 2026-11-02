import nextEnv from "@next/env";
export const root = process.cwd();
nextEnv.loadEnvConfig(root, process.env.NODE_ENV !== "production");

export const config = {
  uri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017",
  database: process.env.MONGODB_DB || "classyar",
  port: Number(process.env.PORT || 4173),
};
