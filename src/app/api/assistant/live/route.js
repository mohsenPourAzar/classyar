import { createRealtimeApi } from "@/lib/server/realtime.mjs";
import { getStore } from "@/lib/server/store.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const api = createRealtimeApi(getStore);
export const POST = api.token;
