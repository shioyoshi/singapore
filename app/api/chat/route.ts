import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { message?: string } | null;
  const message = (body?.message ?? "").slice(0, 1000);
  if (!message) return NextResponse.json({ reply: "今どんな気分ですか？話せる範囲で大丈夫です。" });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ reply: "話してくれてありがとう。ここでは診断はできないけれど、今の気持ちを整理するお手伝いができます。" });
  const response = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0.2, max_tokens: 180, messages: [{ role: "system", content: "あなたは日本の中高生向けウェルビーイングアプリの聞き役です。診断・治療・断定をせず、短く共感的に返答し、危険を感じる表現があれば身近な大人や緊急窓口につなげてください。" }, { role: "user", content: message }] }) });
  if (!response.ok) return NextResponse.json({ reply: "今はAIに接続できません。少し時間を置いて、もう一度試してください。" });
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return NextResponse.json({ reply: data.choices?.[0]?.message?.content ?? "話してくれてありがとう。" });
}
