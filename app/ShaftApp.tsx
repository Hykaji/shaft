"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Tab = "hoje" | "diario" | "treinos" | "financas";
type Sheet = "checkin" | "training" | "expense" | "income" | "planned" | null;

type DashboardData = {
  syncedAt: string;
  level: number;
  xp: number;
  nextLevel: number;
  balance: string;
  week: string;
  checkin: { date: string; mood: string; energy: number; win: string };
  exercises: string[][];
};

const fallbackNotion: DashboardData = {
  syncedAt: "05/08/2026",
  level: 1,
  xp: 0,
  nextLevel: 200,
  balance: "R$ 415,27",
  week: "03–09 de agosto · início leve",
  checkin: {
    date: "4 de agosto",
    mood: "Neutro",
    energy: 6,
    win: "Começou um projeto no Create, passou a manhã com a namorada e estruturou o diário Shaft.",
  },
  exercises: [
    ["Supino na máquina horizontal sentado", "30 kg", "Peito"],
    ["Crucifixo na máquina horizontal sentado", "30 kg", "Peito"],
    ["Flying deitado com pesos", "9 kg", "Peito"],
    ["Rosca tríceps com barra", "15 kg", "Tríceps"],
    ["Tríceps pulley", "15 kg", "Tríceps"],
    ["Abdominal", "Peso corporal", "Abdômen"],
  ],
};

const nav: Array<[Tab, string, string]> = [
  ["hoje", "Hoje", "●"],
  ["diario", "Diário", "✦"],
  ["treinos", "Treinos", "↗"],
  ["financas", "Finanças", "◌"],
];

export function ShaftApp() {
  const [tab, setTab] = useState<Tab>("hoje");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [notion, setNotion] = useState<DashboardData>(fallbackNotion);
  const [live, setLive] = useState(false);
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/notion/dashboard", { cache: "no-store" });
      if (!response.ok) throw new Error();
      setNotion(await response.json());
      setLive(true);
    } catch {
      setLive(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function save(endpoint: string, payload: unknown) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Não foi possível salvar no Notion.");
    await refresh();
    return data;
  }

  function success(message: string) {
    setSheet(null);
    setNotice(message);
    window.setTimeout(() => setNotice(""), 5000);
  }

  return (
    <main className="app-shell">
      <div className="app-frame">
        <header className="topbar">
          <div className="brand-mark" aria-hidden="true">⚙</div>
          <div className="brand-copy"><p className="eyebrow">SHAFT</p><h1>{tab === "hoje" ? "Bom dia, Kaji" : nav.find((item) => item[0] === tab)?.[1]}</h1></div>
          <a className="notion-link" href="https://app.notion.com/p/3b2f65ea97b0804b86befa78f9f63139" target="_blank" rel="noreferrer" aria-label="Abrir painel no Notion">N</a>
        </header>

        <div className="sync-note"><span /> Notion conectado <b>{live ? "Leitura e escrita ativas" : `Leitura de ${notion.syncedAt}`}</b></div>
        {notice && <div className="toast" role="status">✓ {notice}</div>}

        {tab === "hoje" && <Today notion={notion} onCheckin={() => setSheet("checkin")} />}
        {tab === "diario" && <Diary notion={notion} onCheckin={() => setSheet("checkin")} />}
        {tab === "treinos" && <Training notion={notion} onConfirm={() => setSheet("training")} />}
        {tab === "financas" && <Finance notion={notion} onAction={setSheet} />}

        <nav className="bottom-nav" aria-label="Navegação principal">
          {nav.map(([id, label, icon]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><span>{icon}</span>{label}</button>)}
        </nav>
      </div>

      {sheet === "checkin" && <CheckinSheet onClose={() => setSheet(null)} onSave={async (payload) => {
        const data = await save("/api/notion/checkins", payload);
        success(data.leveledUp ? `+${data.xpDay} XP · você subiu para o nível ${data.level}!` : `Check-in salvo · +${data.xpDay} XP`);
      }} />}
      {sheet === "training" && <TrainingSheet exercises={notion.exercises} onClose={() => setSheet(null)} onSave={async (payload) => {
        const data = await save("/api/notion/training", payload);
        success(`Treino e ${data.saved} cargas salvos`);
      }} />}
      {(sheet === "expense" || sheet === "income" || sheet === "planned") && <FinanceSheet mode={sheet} onClose={() => setSheet(null)} onSave={async (payload) => {
        await save("/api/notion/finance", payload);
        success(sheet === "planned" ? "Compra planejada no Notion" : "Movimentação salva no Notion");
      }} />}
    </main>
  );
}

function Today({ notion, onCheckin }: { notion: DashboardData; onCheckin: () => void }) {
  return <section className="page-content">
    <div className="date-row"><span>Quarta, 5 de agosto</span><span className="pill">Dia de trabalho</span></div>
    <article className="hero-card"><div className="hero-top"><span className="eyebrow light">SEU RITMO HOJE</span><span>{notion.level}</span></div><h2>O eixo é voltar,<br />não acertar tudo.</h2><div className="level-row"><div><strong>Nível {notion.level}</strong><span>{notion.xp} de {notion.nextLevel} XP</span></div><div className="progress"><i style={{ width: `${Math.max(2, (notion.xp % 200) / 2)}%` }} /></div></div></article>
    <div className="section-heading"><div><p className="eyebrow">FOCO DE HOJE</p><h2>Três coisas bastam</h2></div><span className="tiny-label">{notion.week}</span></div>
    <div className="focus-list">
      <Focus icon="☾" title="Sono" text="Desacelerar às 23h15" tag="Meta 00h30" />
      <Focus icon="▶" title="Audiobook na ida" text="5–15 minutos na Linha Vermelha" tag="Mínimo vale" />
      <Focus icon="○" title="Dia de descanso" text="Próximo: Costas + Bíceps" tag="Sem cobrança" />
    </div>
    <button className="voice-cta" onClick={onCheckin}><span className="mic">●</span><span><strong>Iniciar diário</strong><small>resumo curto · sem áudio salvo</small></span><b>›</b></button>
    <article className="pending-card"><span>!</span><div><strong>Treino de 04/08 aguarda confirmação</strong><p>Peito + Tríceps · confirme quando quiser.</p></div></article>
  </section>;
}

function Focus({ icon, title, text, tag }: { icon: string; title: string; text: string; tag: string }) {
  return <article className="focus-item"><span className="focus-icon">{icon}</span><div><strong>{title}</strong><p>{text}</p></div><span className="mini-tag">{tag}</span></article>;
}

function Diary({ notion, onCheckin }: { notion: DashboardData; onCheckin: () => void }) {
  return <section className="page-content">
    <div className="intro-block"><p className="eyebrow">UM PASSO DE CADA VEZ</p><h2>Uma conversa,<br />não uma prova.</h2><p>Responda somente o que fizer sentido hoje. A versão mínima sempre vale.</p></div>
    <button className="big-voice" onClick={onCheckin}><span>●</span><strong>Começar check-in</strong><small>Nenhum áudio ou transcrição completa será salvo</small></button>
    <div className="section-heading"><div><p className="eyebrow">ÚLTIMO CHECK-IN · NOTION</p><h2>{notion.checkin.date}</h2></div><span className="pill neutral">{notion.checkin.mood} · energia {notion.checkin.energy}</span></div>
    <article className="quote-card"><p>“{notion.checkin.win}”</p><span>Vitória do dia</span></article>
    <div className="two-grid"><Metric label="XP total" value={String(notion.xp)} note={`${notion.nextLevel - notion.xp} para o próximo nível`} /><Metric label="Regra" value="0−" note="XP nunca diminui" /></div>
  </section>;
}

function Training({ notion, onConfirm }: { notion: DashboardData; onConfirm: () => void }) {
  return <section className="page-content">
    <div className="cycle"><span className="done">Peito<br />Tríceps</span><i /><span className="current">Costas<br />Bíceps</span><i /><span>Perna<br />Ombro</span></div>
    <article className="next-card"><p className="eyebrow light">PRÓXIMO NO CICLO</p><h2>Costas + Bíceps</h2><p>Depois de um dia de descanso · abdominal incluído</p><button>Adicionar exercícios quando eu lembrar</button></article>
    <div className="section-heading"><div><p className="eyebrow">SESSÃO PLANEJADA · NOTION</p><h2>Peito + Tríceps</h2></div><span className="pill">Aguardando</span></div>
    <div className="exercise-list">{notion.exercises.map(([name, load, group], index) => <article key={name}><span>{index + 1}</span><div><strong>{name}</strong><small>{group}</small></div><b>{load}</b></article>)}</div>
    <button className="secondary-button" onClick={onConfirm}>Confirmar treino e cargas</button>
  </section>;
}

function Finance({ notion, onAction }: { notion: DashboardData; onAction: (sheet: Sheet) => void }) {
  return <section className="page-content">
    <article className="balance-card"><div><p className="eyebrow light">SALDO NO NOTION</p><h2>{notion.balance}</h2><span>Compras planejadas não reduzem este saldo</span></div><span className="trend">↗</span></article>
    <div className="quick-actions"><button onClick={() => onAction("expense")}><span>−</span>Registrar gasto</button><button onClick={() => onAction("income")}><span>＋</span>Registrar entrada</button><button onClick={() => onAction("planned")}><span>◇</span>Planejar compra</button></div>
    <div className="section-heading"><div><p className="eyebrow">PRÓXIMAS ENTRADAS</p><h2>Salários</h2></div><span className="tiny-label">Valores variáveis</span></div>
    <article className="salary-card"><span className="calendar-icon">15</span><div><strong>Próximo pagamento habitual</strong><p>Holerite pode ser informado até um dia antes</p></div><b>›</b></article>
    <article className="salary-card muted"><span className="calendar-icon">30</span><div><strong>Segundo pagamento habitual</strong><p>Data e valor sujeitos a alteração</p></div><b>›</b></article>
    <article className="soft-card"><p><strong>Finanças sem culpa.</strong> Lazer, namoro, amigos e descanso são partes legítimas da sua vida. Registrar serve para escolher melhor.</p></article>
  </section>;
}

function SheetFrame({ title, eyebrow, onClose, children }: { title: string; eyebrow: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="form-sheet" role="dialog" aria-modal="true" aria-label={title}><div className="voice-handle" /><button className="sheet-close" onClick={onClose} aria-label="Fechar">×</button><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{children}</div>;
}

function CheckinSheet({ onClose, onSave }: { onClose: () => void; onSave: (payload: unknown) => Promise<void> }) {
  const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try { await onSave(data); } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao salvar."); setSaving(false); }
  }
  return <SheetFrame title="Como foi seu dia?" eyebrow="SALVAR CHECK-IN" onClose={onClose}><form className="shaft-form" onSubmit={submit}>
    <div className="form-grid"><Select label="Tipo de dia" name="dayType" options={["Trabalho", "Folga", "Férias"]} /><Select label="Humor" name="mood" options={["Ótimo", "Bom", "Neutro", "Ruim", "Muito ruim"]} /><Field label="Energia · 1 a 10" name="energy" type="number" min="1" max="10" defaultValue="6" /></div>
    <Select label="Sono" name="sleep" options={["Completo", "Mínimo", "Não feito", "Não planejado"]} defaultValue="Não feito" />
    <Select label="Treino" name="training" options={["Completo", "Mínimo", "Não feito", "Não planejado"]} defaultValue="Não planejado" />
    <Select label="Estudo" name="study" options={["Completo", "Mínimo", "Não feito", "Não planejado"]} defaultValue="Não planejado" />
    <div className="form-grid"><Field label="Audiobook · min" name="audiobookMinutes" type="number" min="0" defaultValue="0" /><Field label="Cachorro · min" name="dogMinutes" type="number" min="0" defaultValue="0" /><Field label="Música · min" name="musicMinutes" type="number" min="0" defaultValue="0" /></div>
    <TextArea label="Vitória do dia" name="win" placeholder="O que vale lembrar?" /><TextArea label="Dificuldade" name="difficulty" placeholder="O que pesou hoje?" /><TextArea label="Próximo passo" name="nextStep" placeholder="Uma ação possível já basta." />
    <p className="form-note">Não planejado não é falha. O XP nunca diminui.</p>{error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={saving}>{saving ? "Salvando…" : "Salvar check-in"}</button>
  </form></SheetFrame>;
}

function FinanceSheet({ mode, onClose, onSave }: { mode: "expense" | "income" | "planned"; onClose: () => void; onSave: (payload: unknown) => Promise<void> }) {
  const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const title = mode === "income" ? "Registrar entrada" : mode === "planned" ? "Planejar compra" : "Registrar gasto";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try { await onSave({ ...data, type: mode === "income" ? "Entrada" : "Saída", planned: mode === "planned" }); } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao salvar."); setSaving(false); }
  }
  return <SheetFrame title={title} eyebrow="FINANÇAS · NOTION" onClose={onClose}><form className="shaft-form" onSubmit={submit}>
    <Field label="Descrição" name="description" placeholder={mode === "planned" ? "Ex.: presente de aniversário" : "Ex.: almoço"} required />
    <Field label="Valor em reais" name="amount" type="number" min="0.01" step="0.01" required />
    <Select label="Categoria" name="category" options={["Salário", "Moradia", "Alimentação", "Transporte", "Saúde", "Estudos", "Lazer e social", "Assinaturas", "Compras", "Outros"]} defaultValue={mode === "income" ? "Salário" : "Compras"} />
    <div className="form-grid"><Select label="Meio" name="method" options={["Pix", "Débito", "Crédito", "Dinheiro", "Transferência", "Outro"]} /><Select label="Necessidade" name="need" options={["Essencial", "Importante", "Desejo", "Não classificado"]} defaultValue="Não classificado" /></div>
    <TextArea label="Observação opcional" name="note" placeholder="Contexto, prazo ou detalhes." />
    <p className="form-note">Registrar dinheiro não altera XP. Lazer e vida social são categorias legítimas.</p>{error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={saving}>{saving ? "Salvando…" : title}</button>
  </form></SheetFrame>;
}

function TrainingSheet({ exercises, onClose, onSave }: { exercises: string[][]; onClose: () => void; onSave: (payload: unknown) => Promise<void> }) {
  const [items, setItems] = useState(exercises.map(([name, load, group]) => ({ name, load: parseFloat(load) || 0, group, completed: true, increase: false })));
  const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); const form = new FormData(event.currentTarget);
    try { await onSave({ exercises: items, status: form.get("status"), duration: form.get("duration"), energy: form.get("energy"), summary: form.get("summary") }); } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao salvar."); setSaving(false); }
  }
  return <SheetFrame title="Confirmar treino" eyebrow="CARGAS · NOTION" onClose={onClose}><form className="shaft-form" onSubmit={submit}>
    <div className="training-edit-list">{items.map((item, index) => <article key={item.name}><div><strong>{item.name}</strong><small>{item.group}</small></div><label><span>Carga</span><input type="number" min="0" step="0.5" value={item.load} onChange={(event) => setItems((current) => current.map((row, i) => i === index ? { ...row, load: Number(event.target.value) } : row))} /></label><label className="check-row"><input type="checkbox" checked={item.completed} onChange={(event) => setItems((current) => current.map((row, i) => i === index ? { ...row, completed: event.target.checked } : row))} />Feito</label><label className="check-row"><input type="checkbox" checked={item.increase} onChange={(event) => setItems((current) => current.map((row, i) => i === index ? { ...row, increase: event.target.checked } : row))} />+5 kg próxima</label></article>)}</div>
    <div className="form-grid"><Select label="Resultado" name="status" options={["Completo", "Mínimo"]} /><Field label="Duração · min" name="duration" type="number" min="1" defaultValue="60" /><Field label="Energia · 1 a 10" name="energy" type="number" min="1" max="10" defaultValue="6" /></div><TextArea label="Resumo opcional" name="summary" placeholder="Como o treino pareceu?" />
    <p className="form-note">Marcar +5 kg cria uma sugestão para a próxima sessão; não altera a carga atual.</p>{error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={saving}>{saving ? "Salvando…" : "Salvar treino"}</button>
  </form></SheetFrame>;
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) { return <label className="field"><span>{label}</span><input {...props} /></label>; }
function Select({ label, options, ...props }: { label: string; options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) { return <label className="field"><span>{label}</span><select {...props}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }
function TextArea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <label className="field"><span>{label}</span><textarea rows={2} {...props} /></label>; }
function Metric({ label, value, note }: { label: string; value: string; note: string }) { return <article className="metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></article>; }
