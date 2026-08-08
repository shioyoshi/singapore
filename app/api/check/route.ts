import { NextResponse } from "next/server";

// Prototype endpoint: keep the API key server-side and send only the selected
// answer scores. Do not send names, chat history, or recordings.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { scores?: number[]; voiceText?: string } | null;
  if (body?.voiceText) return NextResponse.json({ received: true, greeting: body.voiceText.includes("おはよう"), message: body.voiceText.includes("おはよう") ? "挨拶を受け取りました。今日の気分を、あとで自分の言葉で振り返ってみましょう。" : "音声を受け取りました。単語だけで心の健康を判断せず、必要ならセルフチェックを使ってください。", disclaimer: "音声の一語だけでは心の健康を判断しません" });
  const scores = Array.isArray(body?.scores) ? body!.scores!.map(Number).filter(Number.isFinite).slice(0, 8) : [];
  const total = scores.reduce((sum, score) => sum + score, 0);
  const level = total <= 3 ? "穏やか" : total <= 8 ? "少し気になる" : "ケアを増やそう";

  // Add OPENAI_API_KEY in a server environment to swap this deterministic demo
  // for a reviewed prompt. The UI remains useful without a key for local demos.
  return NextResponse.json({ level, total, needsHumanSupport: total > 8, generated: false });
}
