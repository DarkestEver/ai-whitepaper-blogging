import { z } from "zod";

const AI_TIMEOUT_MS = 60_000;
const SYSTEM_PROMPT = "You are a cautious research editor. Never invent facts. Return valid JSON only.";

export type Provider = "openai" | "anthropic" | "google";

const openAiResponseSchema = z.object({
  choices: z.array(z.object({
    message: z.object({ content: z.string().nullable().optional() }).optional(),
  })).optional(),
});

const anthropicResponseSchema = z.object({
  content: z.array(z.object({
    type: z.string().optional(),
    text: z.string().optional(),
  })).optional(),
});

const googleResponseSchema = z.object({
  candidates: z.array(z.object({
    content: z.object({
      parts: z.array(z.object({ text: z.string().optional() })).optional(),
    }).optional(),
  })).optional(),
});

export async function requestProviderText(
  provider: Provider,
  apiKey: string,
  model: string,
  prompt: string,
  fetcher: typeof fetch = fetch,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const request = providerRequest(provider, apiKey, model, prompt, controller.signal);
    const response = await fetcher(request.url, request.init);
    if (!response.ok) {
      console.error("AI provider request failed.", { provider, status: response.status });
      throw new Error(`AI provider request failed with HTTP ${response.status}. Check provider status and server-side credentials.`);
    }
    const data: unknown = await response.json();
    const text = providerText(provider, data);
    if (!text) throw new Error("AI provider returned no text content or an unexpected response shape.");
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

function providerRequest(
  provider: Provider,
  apiKey: string,
  model: string,
  prompt: string,
  signal: AbortSignal,
): { url: string; init: RequestInit } {
  if (provider === "openai") {
    return {
      url: "https://api.openai.com/v1/chat/completions",
      init: {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({
          model,
          max_completion_tokens: 8000,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
        }),
        signal,
      },
    };
  }
  if (provider === "anthropic") {
    return {
      url: "https://api.anthropic.com/v1/messages",
      init: {
        method: "POST",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({
          model,
          max_tokens: 8000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: prompt }],
        }),
        signal,
      },
    };
  }
  return {
    url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    init: {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.1, maxOutputTokens: 8000 },
      }),
      signal,
    },
  };
}

function providerText(provider: Provider, data: unknown): string | undefined {
  if (provider === "openai") {
    const result = openAiResponseSchema.safeParse(data);
    return result.success ? result.data.choices?.[0]?.message?.content?.trim() || undefined : undefined;
  }
  if (provider === "anthropic") {
    const result = anthropicResponseSchema.safeParse(data);
    return result.success
      ? result.data.content?.find((item) => item.type === "text")?.text?.trim() || undefined
      : undefined;
  }
  const result = googleResponseSchema.safeParse(data);
  return result.success
    ? result.data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() || undefined
    : undefined;
}
