import dotenv from "dotenv";
import path from "path";

// Load env vars from root .env
// We use process.cwd() assuming the process starts from apps/api
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
