import { getAppUrl, getFacebookAppId, getFacebookAppSecret } from "@/lib/env";

export const GRAPH_VERSION = "v21.0";
export const GRAPH_URL = `https://graph.facebook.com/${GRAPH_VERSION}`;
const DIALOG_URL = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`;

export const OAUTH_SCOPES = [
  "public_profile",
  "pages_show_list",
  "pages_messaging",
  "business_management",
].join(",");

export class FacebookError extends Error {
  code: number | null;
  constructor(message: string, code: number | null = null) {
    super(message);
    this.code = code;
  }
}

interface FbErrorShape {
  error?: {
    message?: string;
    code?: number;
    error_subcode?: number;
  };
}

async function parseResponse(res: Response) {
  const data = (await res.json().catch(() => ({}))) as FbErrorShape &
    Record<string, unknown>;
  if (!res.ok || data.error) {
    const code = data.error?.code ?? null;
    const sub = data.error?.error_subcode;
    const msg = data.error?.message ?? `HTTP ${res.status}`;
    throw new FacebookError(
      code ? `(#${code}${sub ? `/${sub}` : ""}) ${msg}` : msg,
      code,
    );
  }
  return data;
}

export function getRedirectUri(origin?: string) {
  return `${origin ?? getAppUrl()}/api/auth/facebook/callback`;
}

export function buildAuthUrl(state: string, origin?: string) {
  const params = new URLSearchParams({
    client_id: getFacebookAppId(),
    redirect_uri: getRedirectUri(origin),
    state,
    response_type: "code",
    scope: OAUTH_SCOPES,
  });
  return `${DIALOG_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string, origin?: string) {
  const params = new URLSearchParams({
    client_id: getFacebookAppId(),
    client_secret: getFacebookAppSecret(),
    redirect_uri: getRedirectUri(origin),
    code,
  });
  const data = (await parseResponse(
    await fetch(`${GRAPH_URL}/oauth/access_token?${params.toString()}`),
  )) as { access_token: string; expires_in?: number };
  return data;
}

export async function getLongLivedToken(shortToken: string) {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: getFacebookAppId(),
    client_secret: getFacebookAppSecret(),
    fb_exchange_token: shortToken,
  });
  const data = (await parseResponse(
    await fetch(`${GRAPH_URL}/oauth/access_token?${params.toString()}`),
  )) as { access_token: string; expires_in?: number };
  return data;
}

export interface FbMe {
  id: string;
  name: string;
  email?: string;
  pictureUrl?: string;
}

export async function fetchMe(userToken: string): Promise<FbMe> {
  const params = new URLSearchParams({
    fields: "id,name,picture.type(large)",
    access_token: userToken,
  });
  const data = (await parseResponse(
    await fetch(`${GRAPH_URL}/me?${params.toString()}`),
  )) as {
    id: string;
    name: string;
    email?: string;
    picture?: { data?: { url?: string } };
  };
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    pictureUrl: data.picture?.data?.url,
  };
}

export interface FbPage {
  id: string;
  name: string;
  category?: string;
  accessToken?: string;
  pictureUrl?: string;
}

export async function fetchUserPages(userToken: string): Promise<FbPage[]> {
  const params = new URLSearchParams({
    fields: "id,name,category,access_token,picture{url}",
    limit: "100",
    access_token: userToken,
  });
  const data = (await parseResponse(
    await fetch(`${GRAPH_URL}/me/accounts?${params.toString()}`),
  )) as {
    data?: Array<{
      id: string;
      name: string;
      category?: string;
      access_token?: string;
      picture?: { data?: { url?: string } };
    }>;
  };
  return (data.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    accessToken: p.access_token,
    pictureUrl: p.picture?.data?.url,
  }));
}

export interface FbConversationContact {
  psid: string;
  name: string;
  profilePic?: string;
  snippet?: string;
  threadId: string;
  updatedTime?: string;
}

interface ConversationNode {
  id: string;
  updated_time?: string;
  snippet?: string;
  participants?: {
    data?: Array<{ id: string; name?: string }>;
  };
}

export async function fetchPageConversations(
  facebookPageId: string,
  pageToken: string,
): Promise<FbConversationContact[]> {
  const contacts = new Map<string, FbConversationContact>();
  let url: string | null =
    `${GRAPH_URL}/${facebookPageId}/conversations?` +
    new URLSearchParams({
      platform: "messenger",
      fields: "id,updated_time,snippet,participants.limit(10){id,name}",
      limit: "50",
      access_token: pageToken,
    }).toString();

  let pagesFetched = 0;
  while (url && pagesFetched < 8) {
    const data = (await parseResponse(await fetch(url))) as {
      data?: ConversationNode[];
      paging?: { next?: string };
    };
    for (const convo of data.data ?? []) {
      const participants = convo.participants?.data ?? [];
      const other = participants.find((p) => p.id !== facebookPageId);
      if (!other) continue;
      contacts.set(other.id, {
        psid: other.id,
        name: other.name || "مستخدم فيسبوك",
        snippet: convo.snippet,
        threadId: convo.id,
        updatedTime: convo.updated_time,
      });
    }
    url = data.paging?.next ?? null;
    pagesFetched += 1;
  }
  return Array.from(contacts.values());
}

/** Best-effort: public profile picture for a PSID. May fail without App Review — we ignore errors. */
export async function fetchProfilePic(psid: string, pageToken: string) {
  try {
    const params = new URLSearchParams({
      fields: "profile_pic",
      access_token: pageToken,
    });
    const data = (await parseResponse(
      await fetch(`${GRAPH_URL}/${psid}?${params.toString()}`),
    )) as { profile_pic?: string };
    return data.profile_pic ?? null;
  } catch {
    return null;
  }
}

/** Upload a reusable attachment (image/video) to Facebook's Attachment Upload API. */
export async function uploadAttachment(
  facebookPageId: string,
  pageToken: string,
  type: "image" | "video",
  file: File,
) {
  const form = new FormData();
  form.set(
    "message",
    JSON.stringify({
      attachment: { type, payload: { is_reusable: true } },
    }),
  );
  form.set("filedata", file, file.name);
  const data = (await parseResponse(
    await fetch(
      `${GRAPH_URL}/${facebookPageId}/message_attachments?access_token=${encodeURIComponent(pageToken)}`,
      { method: "POST", body: form },
    ),
  )) as { attachment_id?: string };
  if (!data.attachment_id) {
    throw new FacebookError("لم يرجع فيسبوك معرّف المرفق");
  }
  return data.attachment_id;
}

export interface SendPayload {
  text?: string | null;
  attachment?: {
    type: "image" | "video";
    attachmentId?: string | null;
    url?: string | null;
  } | null;
}

async function postMessage(
  facebookPageId: string,
  pageToken: string,
  body: Record<string, unknown>,
) {
  return parseResponse(
    await fetch(
      `${GRAPH_URL}/${facebookPageId}/messages?access_token=${encodeURIComponent(pageToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    ),
  );
}

function attachmentNode(att: NonNullable<SendPayload["attachment"]>) {
  if (att.attachmentId) return { attachment_id: att.attachmentId };
  return { url: att.url, is_reusable: true };
}

/** Sends text first then the attachment (Messenger shows them in order). */
export async function sendMessage(
  facebookPageId: string,
  pageToken: string,
  psid: string,
  payload: SendPayload,
) {
  const text = payload.text?.trim();
  if (text) {
    await postMessage(facebookPageId, pageToken, {
      recipient: { id: psid },
      messaging_type: "RESPONSE",
      message: { text },
    });
  }
  if (payload.attachment) {
    await postMessage(facebookPageId, pageToken, {
      recipient: { id: psid },
      messaging_type: "RESPONSE",
      message: {
        attachment: {
          type: payload.attachment.type,
          payload: attachmentNode(payload.attachment),
        },
      },
    });
  }
}
