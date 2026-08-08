"use client";

import { useEffect, useMemo, useState } from "react";

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

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 720px)").matches;
    const ua = navigator.userAgent;
    setDevice(`${mobile ? "モバイル" : "PC / タブレット"} · ${/iPhone|Android/i.test(ua) ? "スマートフォン" : "ブラウザ"}`);
  }, []);

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

  return (
    <main>
      <nav className="nav wrap">
        <div className="brand"><span className="brand-mark">◒</span><span>よりみち<span className="brand-dot">.</span></span></div>
        <div className="nav-actions"><span className="privacy-pill">匿名でOK</span><button className="login" onClick={() => setSignedIn(!signedIn)}>{signedIn ? "ログアウト" : "ログイン"}</button></div>
      </nav>

      <section className="hero wrap">
        <div className="hero-copy">
          <p className="eyebrow">KAICHO STUDENT WELLBEING LAB</p>
          <h1>今日の自分に、<br /><em>やさしいよりみち。</em></h1>
          <p className="lead">3分のセルフチェックで、今の心の天気を知る。診断ではなく、あなたが次の一歩を選ぶための場所です。</p>
          <div className="hero-cta"><button className="primary" onClick={() => setStarted(true)}>セルフチェックをはじめる <span>→</span></button><span className="tiny">ログインなしで使えます</span></div>
          <div className="trust-row"><span>🔒 回答は保存しません</span><span>🌱 医療診断ではありません</span></div>
        </div>
        <div className="hero-art" aria-label="気持ちを整えるイラスト"><div className="sun"></div><div className="cloud cloud-a"></div><div className="cloud cloud-b"></div><div className="hill hill-a"></div><div className="hill hill-b"></div><div className="person">⌣</div><div className="flower">✿</div></div>
      </section>

      <section className="features wrap">
        <div><span className="icon coral">✦</span><h3>心の天気予報</h3><p>今日の状態を、短い質問でやさしく確認。</p></div>
        <div><span className="icon blue">↗</span><h3>小さな作戦会議</h3><p>結果に合わせた、無理のない行動を提案。</p></div>
        <div><span className="icon yellow">☼</span><h3>つながる安心</h3><p>つらい時は、学校や相談先への道しるべ。</p></div>
      </section>

      <section className="history-panel wrap">
        <div><div className="section-label">OPTIONAL / LOCAL ONLY</div><h2>LINEの履歴から、<span>最近の傾向</span>を見てみる</h2><p>LINEから書き出したtxtを本人の操作で読み込みます。履歴は送信・保存せず、この端末内で「悲しい／つらい」などの語と日付の近さだけを集計します。</p><label className="upload"><input type="file" accept=".txt,text/plain" onChange={(e) => e.target.files?.[0] && inspectHistory(e.target.files[0])} />txtを選ぶ</label>{historyResult && <div className="history-result"><b>分析した行数：{historyResult.messages}行</b><span>最近のネガティブ語スコア：{historyResult.score}</span><small>会話量が多いほど文脈が増え、精度が上がる可能性はありますが、量だけで判断はしません。</small></div>}</div>
        <div className="device-card"><span>この端末</span><strong>{device}</strong><small>画面幅に合わせてPC / モバイルUIを自動調整しています</small><div className="morning"><b>☀ 毎朝「おはよう」</b><p>挨拶の有無やリズムは、本人の振り返り用に使います。感情を断定したり、学校へ自動共有はしません。</p></div></div>
      </section>

      <section className="method wrap"><div className="section-label">DESIGN NOTE</div><h2>「測る」より、<span>気づいて選べる。</span></h2><p>研究で使われる質問をベースに、海城の生活リズムに合わせた短いチェックへ。会話履歴や声を勝手に集めず、まずは本人の意思で答える設計です。</p><div className="chips"><span>本人の同意</span><span>最小限のデータ</span><span>人につなぐ</span></div></section>

      {started && <div className="modal-backdrop"><div className="check-card" role="dialog" aria-modal="true">
        {step < questions.length ? <><div className="check-top"><span>セルフチェック</span><span>{step + 1} / {questions.length}</span></div><div className="progress"><i style={{width: `${((step) / questions.length) * 100}%`}} /></div><h2>{questions[step]}</h2><p className="hint">ここ1週間を思い出して、一番近いものを選んでください。</p><div className="choices">{choices.map((c, i) => <button key={c} onClick={() => choose(i)}>{c}<span>›</span></button>)}</div><button className="text-button" onClick={() => setStarted(false)}>あとで</button></> : <><div className="result-badge">YOUR WEATHER</div><h2>今日の心の天気は<br /><span>{result}</span> です。</h2><p className="result-copy">この結果は診断ではありません。少しでも気になる時は、ひとりで抱えず誰かに話すことがいちばんのケアです。</p><div className="suggestion"><strong>今日の小さな作戦</strong><p>{score > 8 ? "保健室や信頼できる先生に、5分だけ話してみる" : "スマホを置いて、温かい飲み物をゆっくり飲む"}</p></div><button className="primary full" onClick={() => {setStarted(false); setAnswers([]); setStep(0)}}>ホームにもどる</button><button className="help" onClick={() => setShowPrivacy(true)}>つらさが強い時の相談先を見る</button></>}
        <button className="close" aria-label="閉じる" onClick={() => setStarted(false)}>×</button>
      </div></div>}
      {showPrivacy && <div className="modal-backdrop"><div className="help-card"><button className="close" onClick={() => setShowPrivacy(false)}>×</button><div className="result-badge">HELP IS HERE</div><h2>ひとりで抱えなくて大丈夫。</h2><p>緊急で危険を感じる時は、119（救急）または110へ。学校では保健室・担任・学年の先生に「今つらい」と伝えるだけでも大丈夫です。</p><div className="help-links"><a href="tel:0120-783-556">24時間子供SOSダイヤル<br /><b>0120-0-78310</b></a><a href="tel:0120-279-338">よりそいホットライン<br /><b>0120-279-338</b></a></div></div></div>}

      <footer className="footer wrap"><span>よりみち. / Kaijo wellbeing prototype</span><button onClick={() => setShowPrivacy(true)}>安全とプライバシー</button><span>© 2026</span></footer>
    </main>
  );
}
