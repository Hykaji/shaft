import { apiError, createPage, property, SOURCES } from "../../../lib/notion";
import { authorizeShaftApiRequest } from "../../../chatgpt-auth";

const types = ["Entrada", "Saída", "Economia", "Transferência"];
const categories = ["Salário", "Moradia", "Alimentação", "Transporte", "Saúde", "Estudos", "Lazer e social", "Assinaturas", "Compras", "Outros"];
const methods = ["Pix", "Débito", "Crédito", "Dinheiro", "Transferência", "Outro"];
const needs = ["Essencial", "Importante", "Desejo", "Não classificado"];

function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export async function POST(request: Request) {
  const accessError = await authorizeShaftApiRequest(request);
  if (accessError) return accessError;

  try {
    const body = await request.json() as Record<string, unknown>;
    const type = types.includes(String(body.type)) ? String(body.type) : "Saída";
    const category = categories.includes(String(body.category)) ? String(body.category) : "Outros";
    const method = methods.includes(String(body.method)) ? String(body.method) : "Outro";
    const need = needs.includes(String(body.need)) ? String(body.need) : "Não classificado";
    const amount = Math.round((Number(body.amount) || 0) * 100) / 100;
    const planned = Boolean(body.planned);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(body.date)) ? String(body.date) : today();
    const description = String(body.description ?? "").trim().slice(0, 200);
    const note = String(body.note ?? "").trim().slice(0, 1000);

    if (amount <= 0) return Response.json({ error: "Informe um valor maior que zero." }, { status: 400 });
    if (!description) return Response.json({ error: "Dê um nome para a movimentação." }, { status: 400 });

    const page = await createPage(SOURCES.finances, {
      "Movimentação": property.title(description),
      "Data": property.date(date),
      "Tipo": property.select(type),
      "Categoria": property.select(category),
      "Meio": property.select(method),
      "Necessidade": property.select(need),
      "Valor": property.number(amount),
      "Observação": property.text(note),
      "Planejado": property.checkbox(planned),
      "Recorrente": property.checkbox(Boolean(body.recurring)),
    });

    return Response.json({ id: page.id, saved: true });
  } catch (error) {
    return apiError(error);
  }
}
