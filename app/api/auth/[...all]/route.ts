import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
export const runtime = "nodejs"; // Or "edge" if using edge runtime
