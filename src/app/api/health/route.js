import { createApi } from "@/lib/server/api.mjs";
import { getStore } from "@/lib/server/store.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = createApi(getStore).health;
