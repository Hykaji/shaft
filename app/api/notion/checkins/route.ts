import { apiError, createPage, getNumber, property, query, SOURCES } from "../../../lib/notion";

const statuses = ["Completo", "Mínimo", "Não feito", "Não planejado"];
const moods = ["Ótimo", "Bom", "Neutro", "Ruim", "Muito ruim"];
const dayTypes = ["Trabalho", "Folga", "Férias"];

function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}
function clean(value: unknown, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}
function score(status: string, minimum: number, complete: number) {
  if (status === "Completo") return complete;
  if (status === "Mínimo") return minimum;
  return 0;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(body.date)) ? String(body.date) : today();
    const sleep = statuses.includes(String(body.sleep)) ? String(body.sleep) : "Não planejado";
    const training = statuses.includes(String(body.training)) ? String(body.training) : "Não planejado";
    const study = statuses.includes(String(body.study)) ? String(body.study) : "Não planejado";
    const mood = moods.includes(String(body.mood)) ? String(body.mood) : "Neutro";
    const dayType = dayTypes.includes(String(body.dayType)) ? String(body.dayType) : "Trabalho";
    const energy = Math.max(1, Math.min(10, Number(body.energy) || 5));
    const audiobook = Math.max(0, Math.min(600, Number(body.audiobookMinutes) || 0));
    const dogMinutes = Math.max(0, Math.min(300, Number(body.dogMinutes) || 0));
    const music = Math.max(0, Math.min(600, Number(body.musicMinutes) || 0));

    const existing = await query(SOURCES.checkins, {
      page_size: 1,
      filter: { property: "Data", date: { equals: date } },
    });
    if (existing.results.length) {
      return Response.json({ error: "Já existe um check-in para esta data." }, { status: 409 });
    }

    const latest = await query(SOURCES.checkins, {
      page_size: 1,
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    });
    const previousTotal = latest.results[0] ? getNumber(latest.results[0], "XP total") : 0;
    const xpDay = Math.max(0,
      score(sleep, 5, 10) +
      score(training, 10, 20) +
      score(study, 8, 15) +
      (audiobook >= 15 ? 5 : audiobook >= 5 ? 2 : 0) +
      (dogMinutes >= 20 ? 5 : dogMinutes >= 10 ? 3 : 0) +
      (music >= 30 ? 10 : music >= 10 ? 5 : 0)
    );
    const xpTotal = previousTotal + xpDay;
    const previousLevel = Math.floor(previousTotal / 200) + 1;
    const level = Math.floor(xpTotal / 200) + 1;
    const win = clean(body.win);
    const difficulty = clean(body.difficulty);
    const nextStep = clean(body.nextStep);
    const summary = clean(body.summary) || `Humor ${mood.toLowerCase()}, energia ${energy}. ${win ? `Vitória: ${win}` : "Check-in concluído sem cobrança."}`;

    await createPage(SOURCES.checkins, {
      "Check-in": property.title(`Check-in · ${date.split("-").reverse().slice(0, 2).join("/")}`),
      "Data": property.date(date),
      "Tipo de dia": property.select(dayType),
      "Sono": property.select(sleep),
      "Treino": property.select(training),
      "Estudo": property.select(study),
      "Humor": property.select(mood),
      "Energia": property.number(energy),
      "Audiobook min": property.number(audiobook),
      "Música min": property.number(music),
      "Passeio com cachorro": property.checkbox(dogMinutes >= 10),
      "Vitória do dia": property.text(win),
      "Dificuldade": property.text(difficulty),
      "Próximo passo": property.text(nextStep),
      "Resumo": property.text(summary),
      "XP do dia": property.number(xpDay),
      "XP total": property.number(xpTotal),
      "Nível": property.number(level),
    });

    return Response.json({ xpDay, xpTotal, level, leveledUp: level > previousLevel });
  } catch (error) {
    return apiError(error);
  }
}
