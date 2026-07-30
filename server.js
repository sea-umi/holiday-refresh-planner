import "dotenv/config";
import express from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const app = express();
const port = Number(process.env.PORT || 3000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_INPUTS = {
  tsukare_type: ["体が疲れている", "頭が疲れている", "気力が出ない"],
  available_time: ["1時間", "3時間", "半日", "1日"],
  direction1: ["自宅", "外"],
  direction2: ["ゆったり", "アクティブ", "お任せ", "ゆったりもアクティブも"],
};

app.use(express.json({ limit: "10kb" }));

function validateInputs(body) {
  const inputs = {};

  for (const [key, allowedValues] of Object.entries(ALLOWED_INPUTS)) {
    const value = body?.[key];
    if (typeof value !== "string" || !allowedValues.includes(value)) {
      return { error: `「${key}」の入力が正しくありません。` };
    }
    inputs[key] = value;
  }

  return { inputs };
}

app.post("/api/refresh-plan", async (req, res) => {
  const validation = validateInputs(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  const apiKey = process.env.DIFY_API_KEY;
  if (!apiKey) {
    console.error("DIFY_API_KEY is not configured.");
    return res.status(500).json({ error: "AI連携の設定がまだ完了していません。" });
  }

  const baseUrl = (process.env.DIFY_API_BASE_URL || "https://api.dify.ai/v1").replace(/\/$/, "");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  try {
    const difyResponse = await fetch(`${baseUrl}/chat-messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: validation.inputs,
        query: "休日のリフレッシュプランを提案してください",
        response_mode: "blocking",
        user: `web-${randomUUID()}`,
      }),
      signal: controller.signal,
    });

    const data = await difyResponse.json().catch(() => ({}));
    if (!difyResponse.ok) {
      console.error("Dify API request failed:", difyResponse.status, data?.message);
      return res.status(502).json({ error: "AIプランを取得できませんでした。時間をおいて再度お試しください。" });
    }

    if (typeof data.answer !== "string" || !data.answer.trim()) {
      console.error("Dify response did not include an answer.");
      return res.status(502).json({ error: "AIから有効な回答を受け取れませんでした。" });
    }

    return res.json({ answer: data.answer.trim() });
  } catch (error) {
    const message = error.name === "AbortError"
      ? "AIの応答に時間がかかっています。もう一度お試しください。"
      : "AIプランを取得できませんでした。時間をおいて再度お試しください。";
    console.error("Unexpected Dify API error:", error);
    return res.status(502).json({ error: message });
  } finally {
    clearTimeout(timeoutId);
  }
});

const distPath = path.join(__dirname, "dist");
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => res.sendFile(path.join(distPath, "index.html")));
}

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
