"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, supabaseReady } from "../lib/supabase";

const questions = [
  "最近、気持ちが落ち込んだり、何をしても楽しめないと感じますか？",
  "眠り・食欲・集中力に変化を感じますか？",
  "学校や友だちのことが頭から離れず、しんどさが続いていますか？",
  "今週、自分を責める気持ちや不安が強くなっていますか？",
];

const choices = ["まったくない", "少しある", "かなりある", "とても強い"];

export default function Home() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [started, setStarted] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [device, setDevice] = useState("確認中");
  const [historyResult, setHistoryResult] = useState<{score:number; messages:number; recent:boolean} | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [listening, setListening] = useState(false);
  const [morningMessage, setMorningMessage] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{role: "user" | "ai"; text: string}>>([]);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 720px)").matches;
    const ua = navigator.userAgent;
    setDevice(`${mobile ? "モバイル" : "PC / タブレット"} · ${/iPhone|Android/i.test(ua) ? "スマートフォン" : "ブラウザ"}`);
  }, []);
  useEffect(() => { if (!supabase) return; supabase.auth.getUser().then(({ data }) => setUser(data.user)); const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null)); return () => listener.subscription.unsubscribe(); }, []);

  const authAction = async (mode: "login" | "signup") => {
    if (!supabase) { setAuthError("Supabaseの設定がまだありません。.envにNEXT_PUBLIC_SUPABASE_*を設定してください。"); return; }
    const result = mode === "login" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
    if (result.error) setAuthError(result.error.message); else setShowLogin(false);
  };

  const score = useMemo(() => answers.reduce((a, b) => a + b, 0), [answers]);
  const result = score <= 3 ? "穏やか" : score <= 8 ? "少し気になる" : "ケアを増やそう";

  const choose = (value: number) => {
    const next = [...answers, value];
    setAnswers(next);
    if (next.length < questions.length) setStep(next.length);
    else setStep(questions.length);
  };

  const inspectHistory = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const negative = /(悲しい|つらい|しんどい|最悪|嫌だ|死にたい|消えたい|不安|泣|疲れた|苦しい|傷つ)/;
    const now = Date.now();
    let score = 0;
    for (const line of lines) {
      if (!negative.test(line)) continue;
      const date = line.match(/(20\d{2})[\/-年](\d{1,2})[\/-月](\d{1,2})/);
      const ageDays = date ? Math.max(0, (now - new Date(Number(date[1]), Number(date[2])-1, Number(date[3])).getTime()) / 86400000) : 90;
      score += ageDays < 7 ? 3 : ageDays < 30 ? 2 : 0.5;
    }
    setHistoryResult({ score: Math.round(score * 10) / 10, messages: lines.length, recent: score > 0 });
  };

  const listenMorning = () => {
    const SpeechRecognition = (window as Window & { webkitSpeechRecognition?: new () => { lang: string; start: () => void; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void } }).webkitSpeechRecognition;
    if (!SpeechRecognition) { setMorningMessage("このブラウザは音声入力に対応していません。Chrome / Safariで試してください。"); return; }
    const recognition = new SpeechRecognition(); recognition.lang = "ja-JP"; setListening(true); recognition.start();
    recognition.onresult = async (event) => { const transcript = event.results[0][0].transcript; const response = await fetch("/api/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ voiceText: transcript }) }); const data = await response.json(); setMorningMessage(data.message ?? `「${transcript}」を受け取りました。`); };
    recognition.onend = () => setListening(false);
  };

  const sendChat = async () => { const message = chatInput.trim(); if (!message) return; setChatInput(""); setChatMessages((items) => [...items, { role: "user", text: message }]); const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) }); const data = await response.json(); setChatMessages((items) => [...items, { role: "ai", text: data.reply }]); };

  return (
    <main>
      <nav className="nav wrap">
        <div className="brand"><span className="brand-mark">◒</span><span>よりみち<span className="brand-dot">.</span></span></div>
        <div className="nav-actions"><span className="privacy-pill">匿名でOK</span>{user ? <button className="login" onClick={() => supabase?.auth.signOut()}>ログアウト</button> : <button className="login" onClick={() => setShowLogin(true)}>ログイン</button>}</div>
      </nav>

      <section className="hero wrap">
        <div className="hero-copy">
          <h1>今日の自分に、<br /><em>やさしいよりみち。</em></h1>
          <p className="lead">3分のセルフチェックで、今の心の天気を知る。診断ではなく、あなたが次の一歩を選ぶための場所です。</p>
          <div className="hero-cta"><button className="primary" onClick={() => setStarted(true)}>セルフチェックをはじめる <span>→</span></button><span className="tiny">ログインなしで使えます</span></div>
          <div className="trust-row"><span>🔒 回答は保存しません</span><span>🌱 医療診断ではありません</span></div>
        </div>
        <div className="hero-art" aria-label="気持ちを整えるイラスト"><div className="sun"></div><div className="cloud cloud-a"></div><div className="cloud cloud-b"></div><div className="hill hill-a"></div><div className="hill hill-b"></div><div className="person">⌣</div><div className="flower">✿</div></div>
      </section>

      <section className="morning-card wrap"><div><div className="section-label">GOOD MORNING</div><h2>声で「おはよう」。<span>今日のリズム</span>を残す。</h2><p>音声は「おはよう」という挨拶の有無と習慣だけを振り返るために使います。単語ひとつから心の健康を断定しません。</p>{morningMessage && <div className="morning-message">{morningMessage}</div>}</div><button className={`voice-button ${listening ? "is-listening" : ""}`} onClick={listenMorning} aria-label="おはようを音声入力">{listening ? "●" : "◉"}<small>{listening ? "聞いています" : "タップして話す"}</small></button></section>

      <section className="chat-panel wrap"><div><div className="section-label">AI LISTENING SPACE</div><h2>話せる範囲で、<span>話してみる。</span></h2><p>AIは診断者ではなく、気持ちを整理する聞き役です。会話はこの画面からAPIへ送られ、危険を感じる時は人への相談を優先します。</p></div><button className="primary" onClick={() => setChatOpen(true)}>AIと話す <span>→</span></button></section>

      <section className="features wrap">
        <div><span className="icon coral">✦</span><h3>心の天気予報</h3><p>今日の状態を、短い質問でやさしく確認。</p></div>
        <div><span className="icon blue">↗</span><h3>小さな作戦会議</h3><p>結果に合わせた、無理のない行動を提案。</p></div>
        <div><span className="icon yellow">☼</span><h3>つながる安心</h3><p>つらい時は、学校や相談先への道しるべ。</p></div>
      </section>

      <section className="flow-panel wrap"><div className="section-label">SAFE BY DESIGN</div><h2>話す相手を、<span>自分で選べる。</span></h2><p>友人との既存LINE履歴は読み込みません。生徒が自分の意思でLINE公式アカウントのAIに話しかけ、その会話だけを振り返りに使います。</p><div className="flow-steps"><div><b>01</b><strong>AIに話しかける</strong><small>本人が送った言葉だけ</small></div><i>→</i><div><b>02</b><strong>変化を検出</strong><small>最近の気分や言葉の傾向</small></div><i>→</i><div><b>03</b><strong>本人へフィードバック</strong><small>気づきとして返す</small></div><i>→</i><div><b>04</b><strong>セルフチェック</strong><small>必要なら人へつなぐ</small></div></div><div className="privacy-note">第三者の会話・連絡先・過去ログは取得しません。いつでも削除・停止できます。</div></section>

      <section className="history-panel wrap"><div><div className="section-label">YOUR DEVICE</div><h2>この端末で、<span>自分のペース</span>を。</h2><p>画面幅に応じてPC / モバイルUIを調整しています。ログイン後は、本人が許可した「おはよう」やセルフチェックの記録だけを保存できます。</p></div><div className="device-card"><span>この端末</span><strong>{device}</strong><small>第三者の履歴や連絡先は取得しません</small></div></section>

      <section className="method wrap"><div className="section-label">DESIGN NOTE</div><h2>「測る」より、<span>気づいて選べる。</span></h2><p>研究で使われる質問をベースに、海城の生活リズムに合わせた短いチェックへ。会話履歴や声を勝手に集めず、まずは本人の意思で答える設計です。</p><div className="chips"><span>本人の同意</span><span>最小限のデータ</span><span>人につなぐ</span></div></section>

      {started && <div className="modal-backdrop"><div className="check-card" role="dialog" aria-modal="true">
        {step < questions.length ? <><div className="check-top"><span>セルフチェック</span><span>{step + 1} / {questions.length}</span></div><div className="progress"><i style={{width: `${((step) / questions.length) * 100}%`}} /></div><h2>{questions[step]}</h2><p className="hint">ここ1週間を思い出して、一番近いものを選んでください。</p><div className="choices">{choices.map((c, i) => <button key={c} onClick={() => choose(i)}>{c}<span>›</span></button>)}</div><button className="text-button" onClick={() => setStarted(false)}>あとで</button></> : <><div className="result-badge">YOUR WEATHER</div><h2>今日の心の天気は<br /><span>{result}</span> です。</h2><p className="result-copy">この結果は診断ではありません。少しでも気になる時は、ひとりで抱えず誰かに話すことがいちばんのケアです。</p><div className="suggestion"><strong>今日の小さな作戦</strong><p>{score > 8 ? "保健室や信頼できる先生に、5分だけ話してみる" : "スマホを置いて、温かい飲み物をゆっくり飲む"}</p></div><button className="primary full" onClick={() => {setStarted(false); setAnswers([]); setStep(0)}}>ホームにもどる</button><button className="help" onClick={() => setShowPrivacy(true)}>つらさが強い時の相談先を見る</button></>}
        <button className="close" aria-label="閉じる" onClick={() => setStarted(false)}>×</button>
      </div></div>}
      {showPrivacy && <div className="modal-backdrop"><div className="help-card"><button className="close" onClick={() => setShowPrivacy(false)}>×</button><div className="result-badge">HELP IS HERE</div><h2>ひとりで抱えなくて大丈夫。</h2><p>緊急で危険を感じる時は、119（救急）または110へ。学校では保健室・担任・学年の先生に「今つらい」と伝えるだけでも大丈夫です。</p><div className="help-links"><a href="tel:0120-783-556">24時間子供SOSダイヤル<br /><b>0120-0-78310</b></a><a href="tel:0120-279-338">よりそいホットライン<br /><b>0120-279-338</b></a></div></div></div>}
      {showLogin && <div className="modal-backdrop"><div className="login-card"><button className="close" onClick={() => setShowLogin(false)}>×</button><div className="result-badge">YOUR SPACE</div><h2>よりみちを、<span>自分の場所</span>に。</h2><p>ログインすると、毎朝の「おはよう」やセルフチェックの履歴を本人のアカウントに安全に紐づけられます。学校へ自動共有することはありません。</p><input className="auth-input" type="email" placeholder="メールアドレス" value={email} onChange={(e) => setEmail(e.target.value)} /><input className="auth-input" type="password" placeholder="パスワード（6文字以上）" value={password} onChange={(e) => setPassword(e.target.value)} />{authError && <div className="auth-error">{authError}</div>}<div className="auth-actions"><button className="primary" onClick={() => authAction("login")}>ログイン</button><button className="login" onClick={() => authAction("signup")}>新規登録</button></div>{!supabaseReady && <small className="auth-note">現在はログインなしでも利用できます</small>}</div></div>}
      {chatOpen && <div className="modal-backdrop"><div className="chat-card"><button className="close" onClick={() => setChatOpen(false)}>×</button><div className="result-badge">AI LISTENING SPACE</div><h2>今日、どうだった？</h2><div className="chat-log">{chatMessages.length === 0 && <div className="chat-ai">話せる範囲で大丈夫。今の気分を教えてください。</div>}{chatMessages.map((item, i) => <div key={i} className={item.role === "user" ? "chat-user" : "chat-ai"}>{item.text}</div>)}</div><div className="chat-compose"><input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} placeholder="例：今日は少し疲れた" /><button className="primary" onClick={sendChat}>送る</button></div><small className="auth-note">医療診断ではありません。危険を感じたら身近な大人や緊急窓口へ。</small></div></div>}

      <footer className="footer wrap"><span>よりみち. / Created by GIC Kaijo G Group</span><button className="footer-center" onClick={() => setShowPrivacy(true)}>安全とプライバシー</button><span>© 2026 GIC Kaijo G Group</span></footer>
    </main>
  );
}
