import { apiError, getRelation, getTitle, property, query, SOURCES, updatePage } from "../../../lib/notion";
import { authorizeShaftApiRequest } from "../../../chatgpt-auth";

type ExerciseInput = { name?: string; load?: number; completed?: boolean; increase?: boolean; effort?: string };
const efforts = ["Leve", "Adequado", "Pesado", "Muito pesado", "Não informado"];
const statuses = ["Completo", "Mínimo"];

export async function POST(request: Request) {
  const accessError = await authorizeShaftApiRequest(request);
  if (accessError) return accessError;

  try {
    const body = await request.json() as Record<string, unknown>;
    const exercises = Array.isArray(body.exercises) ? body.exercises as ExerciseInput[] : [];
    const status = statuses.includes(String(body.status)) ? String(body.status) : "Completo";
    const duration = Math.max(1, Math.min(300, Number(body.duration) || 60));
    const energy = Math.max(1, Math.min(10, Number(body.energy) || 5));
    const summary = String(body.summary ?? "").trim().slice(0, 1000);

    if (!exercises.length) return Response.json({ error: "Nenhum exercício foi informado." }, { status: 400 });

    const sessions = await query(SOURCES.sessions, {
      page_size: 1,
      filter: { property: "Status", select: { equals: "Planejado" } },
      sorts: [{ property: "Data", direction: "descending" }],
    });
    const session = sessions.results[0];
    if (!session) return Response.json({ error: "Não há treino planejado aguardando confirmação." }, { status: 404 });

    const records = await query(SOURCES.loads, {
      page_size: 100,
      filter: { property: "Sessão", relation: { contains: session.id } },
    });
    let saved = 0;

    for (const item of exercises) {
      const name = String(item.name ?? "").trim();
      const record = records.results.find((page) => getTitle(page, "Registro").startsWith(name));
      if (!record) continue;
      const load = Number.isFinite(Number(item.load)) ? Math.max(0, Number(item.load)) : null;
      const increase = Boolean(item.increase) && load !== null;
      const nextLoad = increase ? Number(load) + 5 : null;
      const effort = efforts.includes(String(item.effort)) ? String(item.effort) : "Não informado";

      await updatePage(record.id, {
        "Carga kg": property.number(load),
        "Concluído": property.checkbox(Boolean(item.completed)),
        "Aumentar 5 kg próxima": property.checkbox(increase),
        "Próxima carga kg": property.number(nextLoad),
        "Esforço": property.select(effort),
      });
      saved += 1;

      const exerciseId = getRelation(record, "Exercício")[0];
      if (exerciseId && increase && nextLoad !== null) {
        await updatePage(exerciseId, {
          "Pronto para subir": property.checkbox(true),
          "Próxima carga kg": property.number(nextLoad),
        });
      }
    }

    await updatePage(session.id, {
      "Status": property.select(status),
      "Duração min": property.number(duration),
      "Energia": property.number(energy),
      "Abdômen": property.checkbox(exercises.some((item) => String(item.name).toLowerCase().includes("abdominal") && item.completed)),
      "Resumo": property.text(summary || `${saved} exercícios registrados pelo Shaft.`),
    });

    return Response.json({ saved, sessionUpdated: true });
  } catch (error) {
    return apiError(error);
  }
}
