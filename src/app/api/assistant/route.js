import { createAssistantApi } from "@/lib/server/assistant.mjs";
import { getStore } from "@/lib/server/store.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const api = createAssistantApi(getStore);
export const GET = api.status;
export const POST = api.request;
