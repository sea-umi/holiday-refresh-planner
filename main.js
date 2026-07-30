import "./style.css";

const QUESTIONS = [
  {
    id: "fatigue",
    label: "QUESTION 01",
    title: "いまの疲れはどんな種類ですか？",
    options: [
      { value: "body", text: "体が疲れている" },
      { value: "head", text: "頭が疲れている" },
      { value: "will", text: "気力が出ない" },
    ],
  },
  {
    id: "time",
    label: "QUESTION 02",
    title: "どのくらい時間を使えますか？",
    options: [
      { value: "1h", text: "1時間" },
      { value: "3h", text: "3時間" },
      { value: "half", text: "半日" },
      { value: "full", text: "1日" },
    ],
  },
  {
    id: "place",
    label: "QUESTION 03",
    title: "どこで過ごしたいですか？",
    options: [
      { value: "home", text: "自宅" },
      { value: "out", text: "外" },
    ],
  },
  {
    id: "style",
    label: "QUESTION 04",
    title: "どんな過ごし方がいいですか？",
    options: [
      { value: "relax", text: "ゆったり" },
      { value: "active", text: "アクティブ" },
      { value: "any", text: "お任せ" },
      { value: "both", text: "ゆったりもアクティブも" },
    ],
  },
];

const OPTION_LABELS = (() => {
  const map = {};
  QUESTIONS.forEach((q) => {
    q.options.forEach((o) => {
      map[o.value] = o.text;
    });
  });
  return map;
})();

const TOTAL_STEPS = QUESTIONS.length;
const CONFIRM_STEP = TOTAL_STEPS;

const STATE = {
  step: 0,
  answers: {},
  view: "form",
  result: "",
  error: "",
};

const CHECK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function render() {
  const app = document.querySelector("#app");
  app.innerHTML = `
    <div class="app-shell">
      ${renderHeader()}
      ${renderProgress()}
      ${renderContent()}
      <p class="app-footer">あなたの休日に、やすらぎを。</p>
    </div>
  `;
  bindEvents();
}

function renderHeader() {
  if (STATE.view === "result") {
    return `
      <header class="app-header">
        <h1 class="app-title">休日リフレッシュプランナー</h1>
        <p class="app-subtitle">あなた専用のプランができました</p>
      </header>
    `;
  }
  return `
    <header class="app-header">
      <h1 class="app-title">休日リフレッシュプランナー</h1>
      <p class="app-subtitle">4つの質問に答えて、あなただけの休日を</p>
    </header>
  `;
}

function renderProgress() {
  if (STATE.view === "result") {
    return "";
  }
  const totalDots = TOTAL_STEPS + 1;
  const current = STATE.view === "form" ? STATE.step : CONFIRM_STEP;
  const dots = Array.from({ length: totalDots }, (_, i) => {
    let cls = "";
    if (i < current) cls = "is-done";
    else if (i === current) cls = "is-active";
    return `<span class="progress-dot ${cls}"></span>`;
  }).join("");
  return `<div class="progress">${dots}</div>`;
}

function renderContent() {
  if (STATE.view === "loading") {
    return renderLoading();
  }
  if (STATE.view === "result") {
    return renderResult();
  }
  if (STATE.view === "confirm" || STATE.step === CONFIRM_STEP) {
    return renderConfirm();
  }
  return renderQuestion();
}

function renderQuestion() {
  const q = QUESTIONS[STATE.step];
  const currentAnswer = STATE.answers[q.id];

  const optionsHtml = q.options.map((opt) => {
    const selected = currentAnswer === opt.value ? "is-selected" : "";
    return `
      <button class="option ${selected}" data-action="select" data-question="${q.id}" data-value="${opt.value}" type="button">
        <span class="option-check">${CHECK_ICON}</span>
        <span class="option-text">${opt.text}</span>
      </button>
    `;
  }).join("");

  const isFirst = STATE.step === 0;

  return `
    <section class="step is-open card">
      <p class="question-label">${q.label}</p>
      <h2 class="question-title">${q.title}</h2>
      <div class="options">${optionsHtml}</div>
      <div class="nav-row">
        <button class="btn btn-secondary" data-action="prev" type="button" ${isFirst ? "disabled" : ""}>前へ戻る</button>
        <button class="btn btn-primary" data-action="next" type="button" ${currentAnswer ? "" : "disabled"}>次へ進む</button>
      </div>
    </section>
  `;
}

function renderConfirm() {
  const items = QUESTIONS.map((q, i) => {
    const value = STATE.answers[q.id];
    const label = value ? OPTION_LABELS[value] : "未選択";
    return `
      <div class="confirm-item">
        <div>
          <p class="confirm-item-label">Q${i + 1} ${q.title.replace("？", "")}</p>
          <p class="confirm-item-value">${label}</p>
        </div>
        <button class="confirm-item-edit" data-action="edit" data-step="${i}" type="button">変更</button>
      </div>
    `;
  }).join("");

  return `
    <section class="step is-open card">
      <p class="question-label">CONFIRM</p>
      <h2 class="question-title">選択内容を確認してください</h2>
      <div class="confirm-list">${items}</div>
      ${STATE.error ? `<p class="form-error" role="alert">${escapeHtml(STATE.error)}</p>` : ""}
      <div class="nav-row">
        <button class="btn btn-secondary" data-action="prev" type="button">前へ戻る</button>
        <button class="btn btn-primary" data-action="restart" type="button">やり直す</button>
      </div>
      <div style="margin-top: var(--space-3);">
        <button class="btn btn-accent" data-action="generate" type="button">AIにプランを作成してもらう</button>
      </div>
    </section>
  `;
}

function renderLoading() {
  return `
    <section class="step is-open card">
      <div class="loading">
        <div class="loading-dots"><span></span><span></span><span></span></div>
        <p class="loading-text">AIがあなたに合ったプランを作成しています…<br />少々お待ちください</p>
      </div>
    </section>
  `;
}

function renderResult() {
  return `
    <section class="step is-open result-card">
      <div class="result-header">
        <span class="result-badge">AI PROGRAM</span>
      </div>
      <h2 class="result-title">あなたのためのリフレッシュプラン</h2>
      <p class="result-message">選択した内容をもとに、Dify AIが提案したプランです。</p>
      <div class="ai-answer">${escapeHtml(STATE.result)}</div>
      <div class="restart-row">
        <button class="btn btn-primary" data-action="restart" type="button">もう一度プランを作る</button>
      </div>
    </section>
  `;
}

function generatePlan(answers) {
  const fatigue = OPTION_LABELS[answers.fatigue] || "";
  const time = OPTION_LABELS[answers.time] || "";
  const place = OPTION_LABELS[answers.place] || "";
  const style = OPTION_LABELS[answers.style] || "";

  const titles = {
    body: "からだをいたわる、癒やしの休日",
    head: "あたまをからっぽにする、静かな休日",
    will: "少しずつ活力を取り戻す、やさしい休日",
  };
  const title = titles[answers.fatigue] || "あなたらしい、リフレッシュ休日";

  const messages = {
    body: "体が疲れているときは無理をせず、温かく心地よい刺激で筋肉の緊張をほどいていきましょう。ゆっくり深い呼吸を心がけて。",
    head: "頭が疲れているときは「なにも考えない時間」がいちばんの薬です。情報から離れ、感覚だけを味わう時間を大切に。",
    will: "気力が出ない日は、がんばらないことが正解です。小さな心地よい行動を一つずつ積み重ねていきましょう。",
  };
  const message = messages[answers.fatigue] || "あなたの今の状態に合わせて、心と体が休まる時間を少しずつ取りましょう。";

  const items = [];

  if (answers.fatigue === "body") {
    items.push({ time: "0:00", title: "温かい飲みものをいれる", desc: "ノンカフェインのお茶や白湯をゆっくり淹れて、両手で包むように持って温もりを感じましょう。" });
    if (answers.place === "home") {
      items.push({ time: "0:10", title: "湯船にゆっくり浸かる", desc: "38〜40度のぬるめのお湯に15分ほど浸かり、肩まで包まれて筋肉の緊張をほどきます。" });
    } else {
      items.push({ time: "0:20", title: "近所の銭湯・温泉へ", desc: "湯船に浸かって温まり、外の空気を感じながら歩くと血流が良くなります。" });
    }
    items.push({ time: "0:40", title: "ストレッチで体をほどく", desc: "首・肩・腰をゆっくり伸ばす軽いストレッチを5分。痛気持ちよい程度で止めておきましょう。" });
    items.push({ time: "0:55", title: "好きな音楽で横になる", desc: "目を閉じてお気に入りの静かな音楽を聴きながら、体の重みをベッドや床に預けます。" });
  } else if (answers.fatigue === "head") {
    items.push({ time: "0:00", title: "スマホを別の部屋に置く", desc: "通知音を切り、手の届かない場所に置いて情報の流入をシャットアウトします。" });
    if (answers.place === "home") {
      items.push({ time: "0:05", title: "部屋を少し片付ける", desc: "目に入る範囲を整えるだけで頭のノイズが減ります。5分だけ、と決めてやりましょう。" });
    } else {
      items.push({ time: "0:05", title: "緑のある場所へ出る", desc: "公園や並木道を歩き、木々や空を見上げて。自然の色や音が脳の疲れを和らげます。" });
    }
    items.push({ time: "0:20", title: "「なにもしない」時間を作る", desc: "座って目を閉じるか、ぼんやりと外を眺めるだけ。效率を求めない時間が頭を休ませます。" });
    items.push({ time: "0:45", title: "ひたすら歩く", desc: "目的地を作らず、ただ足の裏の感覚に意識を向けながら歩き続けます。" });
  } else {
    items.push({ time: "0:00", title: "温かい飲みものをいれる", desc: "白湯やハーブティーをゆっくり淹れて、まずは一口だけ味わってみましょう。" });
    items.push({ time: "0:10", title: "窓を開けて深呼吸", desc: "外の空気を3回深く吸って、ゆっくり吐く。体が目を覚ます感覚を確かめます。" });
    if (answers.place === "out") {
      items.push({ time: "0:20", title: "コンビニやカフェまで散歩", desc: "「近場まで」を目標にして外へ。帰り道にお菓子を一つ買う小さなご褒美も。" });
    } else {
      items.push({ time: "0:20", title: "好きな匂いでリラックス", desc: "アロマやお香、洗剤の匂いなど、心地よい香りをひと嗅ぎ。感覚が目を覚まします。" });
    }
    items.push({ time: "0:35", title: "軽く体を動かす", desc: "ラジオ体操程度の軽い動きを5分。汗をかかない程度で構いません。" });
    items.push({ time: "0:50", title: "好きな番組を少しだけ見る", desc: "感想を考えず、ただ映像を流し見るだけ。あえて「なにも考えない時間」を許可します。" });
  }

  if (answers.style === "active") {
    items.push({ time: "続き", title: "体を動かす時間を足す", desc: "ヨガ・ストレッチ・散歩など、気持ちよく動ける時間をもう15分追加してみましょう。" });
  } else if (answers.style === "both") {
    items.push({ time: "続き", title: "ゆったり + 動く、を交互に", desc: "静かな時間と軽い運動を交互に挟み、心と体の両方が満たされるようにしましょう。" });
  } else if (answers.style === "any") {
    items.push({ time: "続き", title: "その日の気分で選ぶ", desc: "静かに過ごすか動くか、その瞬間の体感に従って選んでみてください。" });
  }

  return { title, message, items };
}

function bindEvents() {
  document.querySelectorAll("[data-action]").forEach((el) => {
    el.addEventListener("click", handleAction);
  });
}

function buildDifyInputs() {
  return {
    tsukare_type: OPTION_LABELS[STATE.answers.fatigue],
    available_time: OPTION_LABELS[STATE.answers.time],
    direction1: OPTION_LABELS[STATE.answers.place],
    direction2: OPTION_LABELS[STATE.answers.style],
  };
}

async function requestRefreshPlan() {
  STATE.error = "";
  STATE.view = "loading";
  render();

  try {
    const response = await fetch("/api/refresh-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildDifyInputs()),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || typeof data.answer !== "string") {
      throw new Error(data.error || "AIプランを取得できませんでした。時間をおいて再度お試しください。");
    }

    STATE.result = data.answer;
    STATE.view = "result";
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    STATE.error = error instanceof Error
      ? error.message
      : "AIプランを取得できませんでした。時間をおいて再度お試しください。";
    STATE.view = "confirm";
    render();
  }
}

function handleAction(e) {
  const action = e.currentTarget.getAttribute("data-action");

  if (action === "select") {
    const qid = e.currentTarget.getAttribute("data-question");
    const value = e.currentTarget.getAttribute("data-value");
    STATE.answers[qid] = value;
    STATE.error = "";
    render();
    return;
  }

  if (action === "next") {
    if (STATE.step < TOTAL_STEPS - 1) {
      STATE.step += 1;
      STATE.view = "form";
      render();
    } else {
      STATE.view = "confirm";
      render();
    }
    return;
  }

  if (action === "prev") {
    if (STATE.view === "confirm") {
      STATE.view = "form";
      STATE.step = TOTAL_STEPS - 1;
    } else if (STATE.step > 0) {
      STATE.step -= 1;
    }
    render();
    return;
  }

  if (action === "edit") {
    const step = Number(e.currentTarget.getAttribute("data-step"));
    STATE.view = "form";
    STATE.step = step;
    render();
    return;
  }

  if (action === "generate") {
    void requestRefreshPlan();
    return;
  }

  if (action === "restart") {
    STATE.step = 0;
    STATE.answers = {};
    STATE.view = "form";
    STATE.result = "";
    STATE.error = "";
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
}

render();
