import { createConversationsApi } from "@/lib/server/conversations.mjs";
import { getStore } from "@/lib/server/store.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const api = createConversationsApi(getStore);
export const GET = api.read;
export const POST = api.save;
