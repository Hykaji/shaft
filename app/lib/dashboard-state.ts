export type SyncStatus = "loading" | "available" | "unavailable";
export type DashboardRequestKind = "initial" | "refresh" | "retry";
export type ExerciseLoadKind = "weight" | "bodyweight";
export type ExerciseRow = {
  name: string;
  loadKind: ExerciseLoadKind;
  loadLabel: string;
  loadKg: number;
  group: string;
};

export type TrainingFormItem = {
  name: string;
  group: string;
  loadKind: ExerciseLoadKind;
  loadInput: string;
  completed: boolean;
  increase: boolean;
};

export type TrainingExercisePayload = {
  name: string;
  load: number;
  completed: boolean;
  increase: boolean;
};

export type DashboardData = {
  syncedAt: string;
  level: number;
  xp: number;
  nextLevel: number;
  balance: string;
  week: string;
  checkin: { date: string; mood: string; energy: number; win: string };
  exercises: unknown;
};

export type DashboardState = {
  notion: DashboardData | null;
  syncStatus: SyncStatus;
  latestRequestId: number;
  retrying: boolean;
};

export type DashboardAction =
  | { type: "start"; requestId: number; kind: DashboardRequestKind }
  | { type: "success"; requestId: number; data: DashboardData }
  | { type: "failure"; requestId: number };

export const initialDashboardState: DashboardState = {
  notion: null,
  syncStatus: "loading",
  latestRequestId: 0,
  retrying: false,
};

export function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  if (action.type === "start") {
    if (action.requestId <= state.latestRequestId) return state;
    return {
      ...state,
      syncStatus: "loading",
      latestRequestId: action.requestId,
      retrying: action.kind === "retry",
    };
  }

  if (action.requestId !== state.latestRequestId) return state;

  if (action.type === "success") {
    return {
      notion: action.data,
      syncStatus: "available",
      latestRequestId: state.latestRequestId,
      retrying: false,
    };
  }

  return {
    notion: null,
    syncStatus: "unavailable",
    latestRequestId: state.latestRequestId,
    retrying: false,
  };
}

export function getValidExercises(value: unknown): ExerciseRow[] {
  if (!Array.isArray(value) || value.length === 0) return [];

  const names = new Set<string>();
  const exercises: ExerciseRow[] = [];

  for (const item of value) {
    if (!Array.isArray(item) || item.length !== 3 || !item.every((field) => typeof field === "string")) {
      return [];
    }

    const [rawName, rawLoad, rawGroup] = item as string[];
    const name = rawName.trim();
    const normalizedName = name.toLocaleLowerCase("pt-BR");
    const load = parseSupportedLoad(rawLoad);
    if (!name || !load || names.has(normalizedName)) return [];

    names.add(normalizedName);
    exercises.push({ name, loadKind: load.kind, loadLabel: load.label, loadKg: load.kg, group: rawGroup.trim() });
  }

  return exercises;
}

export function parseSupportedLoad(value: string): { kind: ExerciseLoadKind; label: string; kg: number } | null {
  const load = value.trim();
  if (load.toLocaleLowerCase("pt-BR") === "peso corporal") {
    return { kind: "bodyweight", label: "Peso corporal", kg: 0 };
  }

  const match = /^(\d+(?:[.,]\d+)?)\s*kg$/i.exec(load);
  if (!match) return null;

  const kg = Number(match[1].replace(",", "."));
  if (!Number.isFinite(kg) || kg < 0 || !Number.isInteger(kg * 2)) return null;

  return { kind: "weight", label: `${match[1]} kg`, kg };
}

export function createTrainingFormItems(exercises: ExerciseRow[]): TrainingFormItem[] {
  return exercises.map(({ name, group, loadKind, loadKg }) => ({
    name,
    group,
    loadKind,
    loadInput: loadKind === "weight" ? String(loadKg) : "",
    completed: true,
    increase: false,
  }));
}

export function updateTrainingFormLoad(items: TrainingFormItem[], index: number, value: string): TrainingFormItem[] {
  return items.map((item, itemIndex) =>
    itemIndex === index && item.loadKind === "weight" ? { ...item, loadInput: value } : item,
  );
}

export function parseEditableLoad(value: string): number | null {
  if (!/^\d+(?:\.\d+)?$/.test(value)) return null;

  const kg = Number(value);
  if (!Number.isFinite(kg) || kg < 0 || !Number.isInteger(kg * 2)) return null;
  return kg;
}

export function isTrainingFormValid(items: TrainingFormItem[]): boolean {
  return items.length > 0 && items.every((item) =>
    item.loadKind === "bodyweight" || parseEditableLoad(item.loadInput) !== null,
  );
}

export function buildTrainingExercisePayload(items: TrainingFormItem[]): TrainingExercisePayload[] | null {
  if (!isTrainingFormValid(items)) return null;

  const payload: TrainingExercisePayload[] = [];

  for (const item of items) {
    if (item.loadKind === "bodyweight") {
      payload.push({ name: item.name, load: 0, completed: item.completed, increase: false });
      continue;
    }

    const load = parseEditableLoad(item.loadInput);
    if (load === null) return null;
    payload.push({ name: item.name, load, completed: item.completed, increase: item.increase });
  }

  return payload;
}

export function shouldShowRetryAction(state: Pick<DashboardState, "syncStatus" | "retrying">) {
  return state.syncStatus === "unavailable" || state.retrying;
}
