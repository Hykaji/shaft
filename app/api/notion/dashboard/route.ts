import { apiError, getCheckbox, getNumber, getSelect, getText, getTitle, query, SOURCES } from "../../../lib/notion";
import type { NotionPage } from "../../../lib/notion";

function getDate(page: NotionPage, name: string) {
  return ((page.properties[name]?.date as { start?: string } | null)?.start) ?? "";
}

export async function GET() {
  try {
    const [checkins, weeks, finances, exercises] = await Promise.all([
      query(SOURCES.checkins, { page_size: 1, sorts: [{ timestamp: "created_time", direction: "descending" }] }),
      query(SOURCES.weeks, { page_size: 1, filter: { property: "Status", select: { equals: "Ativa" } } }),
      query(SOURCES.finances, { page_size: 100 }),
      query(SOURCES.exercises, { page_size: 100, filter: { property: "Ativo", checkbox: { equals: true } }, sorts: [{ property: "Ordem", direction: "ascending" }] }),
    ]);

    const latest = checkins.results[0];
    const activeWeek = weeks.results[0];
    const xp = latest ? getNumber(latest, "XP total") : 0;
    const level = Math.floor(xp / 200) + 1;
    const balance = finances.results.reduce((total, page) => {
      if (getCheckbox(page, "Planejado")) return total;
      const value = getNumber(page, "Valor");
      const kind = getSelect(page, "Tipo");
      if (kind === "Entrada" || kind === "Saldo inicial") return total + value;
      if (kind === "Saída" || kind === "Economia") return total - value;
      return total;
    }, 0);

    return Response.json({
      syncedAt: new Intl.DateTimeFormat("pt-BR").format(new Date()),
      level,
      xp,
      nextLevel: level * 200,
      balance: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(balance),
      week: activeWeek ? getTitle(activeWeek, "Semana") : "Semana ainda não definida",
      checkin: latest ? {
        date: new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", timeZone: "America/Sao_Paulo" }).format(new Date(`${getDate(latest, "Data")}T12:00:00-03:00`)),
        mood: getSelect(latest, "Humor") || "Não informado",
        energy: getNumber(latest, "Energia"),
        win: getText(latest, "Vitória do dia") || "Check-in registrado.",
      } : { date: "Sem check-in", mood: "—", energy: 0, win: "Seu primeiro check-in aparecerá aqui." },
      exercises: exercises.results.map((page) => [
        getTitle(page, "Exercício"),
        getNumber(page, "Carga atual kg") ? `${getNumber(page, "Carga atual kg")} kg` : "Peso corporal",
        getSelect(page, "Grupo muscular"),
      ]),
    }, { headers: { "Cache-Control": "private, max-age=60" } });
  } catch (error) {
    return apiError(error);
  }
}
