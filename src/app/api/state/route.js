import { createApi } from "@/lib/server/api.mjs";
import { getStore } from "@/lib/server/store.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const api = createApi(getStore);
export const GET = api.read;
export const PUT = api.write;
