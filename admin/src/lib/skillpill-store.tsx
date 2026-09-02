import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { type LearningLessonContent, type Skill } from "./skillpill-data";

type SkillInput = Omit<Skill, "id" | "orders" | "revenue">;

type ApiSkill = {
  id: string;
  title: string;
  shortDescription: string;
  category: string;
  price: number;
  coverUrl?: string;
  estimatedTime?: string;
  difficulty?: string;
  digitalContent?: string;
  label?: Skill["label"];
  landingHeadline?: string;
  landingDescription?: string;
  transformation?: string;
  curriculum?: Array<unknown>;
  isCustom?: boolean;
  lessons?: Array<Partial<LearningLessonContent> & Record<string, unknown>>;
  [key: string]: unknown;
};

export type AdminProfile = {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  purchasedSkillPills: string[];
  completedSkillCount: number;
  learningHours: number;
  streakDays: number;
};

export type AdminUser = AdminProfile & {
  phone?: string;
  role: "admin" | "user";
  plan: "free" | "pro";
};

export type AdminUserInput = {
  name: string;
  email: string;
  password?: string;
  role: AdminUser["role"];
  plan: AdminUser["plan"];
};

export type LeaderboardRow = {
  rank: number;
  name: string;
  cohort: string;
  pills: number;
  streak: number;
  points: number;
  user: AdminUser;
};

export type ApiOrder = {
  id: string;
  userId: string;
  items: Array<{ skillId: string; title: string; price: number }>;
  total: number;
  status: "paid" | "pending" | "refunded";
  createdAt: string;
};

type Store = {
  skills: Skill[];
  orders: ApiOrder[];
  profile: AdminProfile | null;
  users: AdminUser[];
  leaderboard: LeaderboardRow[];
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  createSkill: (input: SkillInput) => Promise<void>;
  updateSkill: (id: string, input: SkillInput) => Promise<void>;
  deleteSkill: (id: string) => Promise<void>;
  createUser: (input: AdminUserInput & { password: string }) => Promise<void>;
  updateUser: (id: string, input: AdminUserInput) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateOrderStatus: (id: string, status: ApiOrder["status"]) => Promise<void>;
};

const SkillpillContext = createContext<Store | null>(null);
const apiBaseUrl = (import.meta.env.VITE_SKILLPILL_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
const tokenKey = "skillpill-admin-jwt";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = window.localStorage.getItem(tokenKey);
  if (!token) throw new Error("Sesi admin belum aktif.");
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers },
  });
  if (response.status === 401) {
    window.localStorage.removeItem(tokenKey);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string; message?: string; errors?: Record<string, string[]> } | null;
    const validationError = body?.errors ? Object.values(body.errors)[0]?.[0] : null;
    throw new Error(response.status === 401 ? "Sesi admin berakhir." : validationError ?? body?.error ?? body?.message ?? "Tidak dapat terhubung ke API SkillPill.");
  }
  return response.json() as Promise<T>;
}

function toAdminSkill(skill: ApiSkill, orders: ApiOrder[]): Skill {
  const matchingOrders = orders.filter(
    (order) => order.status === "paid" && order.items.some((item) => item.skillId === skill.id),
  );
  const revenue = matchingOrders.reduce(
    (total, order) => total + order.items
      .filter((item) => item.skillId === skill.id)
      .reduce((itemTotal, item) => itemTotal + item.price, 0), 0);

  const lessons: LearningLessonContent[] = (skill.lessons ?? []).map((lesson, index) => {
    const legacyBody = [lesson.bigPicture, lesson.definition, lesson.whyItMatters]
      .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
      .join("\n\n");
    const slides = Array.isArray(lesson.slides) && lesson.slides.length
      ? lesson.slides
      : [{ id: `slide-${index + 1}-1`, title: String(lesson.title ?? `Modul ${index + 1}`), body: String(lesson.bigPicture ?? skill.shortDescription), bullets: [], speakerNotes: "", imageUrl: "" }];
    const bentoCards = Array.isArray(lesson.bentoCards) && lesson.bentoCards.length
      ? lesson.bentoCards
      : [
          { id: `bento-${index + 1}-1`, label: "Gambaran Besar", title: "", content: String(lesson.bigPicture ?? skill.shortDescription), tone: "default" as const, wide: false },
          { id: `bento-${index + 1}-2`, label: "Definisi Inti", title: "", content: String(lesson.definition ?? skill.shortDescription), tone: "accent" as const, wide: false },
        ];
    return {
      id: String(lesson.id ?? `module-${index + 1}`),
      title: String(lesson.title ?? `${skill.title} — Modul ${index + 1}`),
      learningObjective: String(lesson.learningObjective ?? skill.landingDescription ?? skill.shortDescription),
      article: lesson.article ?? { title: String(lesson.title ?? skill.title), body: legacyBody || skill.shortDescription },
      audio: lesson.audio ?? { title: `Audio ${String(lesson.title ?? skill.title)}`, url: "", transcript: legacyBody || skill.shortDescription, duration: "" },
      slides,
      bentoCards,
    };
  });

  return {
    id: skill.id,
    title: skill.title,
    image: skill.coverUrl ?? "",
    landingHeadline: skill.landingHeadline ?? skill.shortDescription,
    landingDescription: skill.landingDescription ?? skill.transformation ?? skill.shortDescription,
    price: skill.price,
    label: skill.label ?? (skill.isCustom ? "Baru" : "Bestseller"),
    category: skill.category,
    digitalContent: skill.digitalContent ?? `${skill.curriculum?.length ?? 0} modul · ${skill.estimatedTime ?? "20 mins"} · ${skill.difficulty ?? "Beginner"}`,
    lessons,
    orders: matchingOrders.length,
    revenue,
  };
}

function createApiSkill(input: SkillInput): Omit<ApiSkill, "id"> {
  const description = input.landingHeadline || input.landingDescription || "SkillPill baru dari SkillPill Admin.";
  const detailParts = input.digitalContent.split(/\s*(?:•|·)\s*/);
  const moduleCount = Math.max(1, input.lessons.length || Number.parseInt(detailParts[0], 10) || 1);
  const estimatedTime = detailParts[1] || "20 mins";
  const difficulty = detailParts[2] || "Beginner";
  const sourceLessons = input.lessons.length
    ? input.lessons
    : Array.from({ length: moduleCount }, (_, index) => ({
        id: `module-${index + 1}`,
        title: `${input.title} — Modul ${index + 1}`,
        learningObjective: input.landingDescription || description,
        article: { title: `${input.title} — Modul ${index + 1}`, body: description },
        audio: { title: `Audio ${input.title}`, url: "", transcript: description, duration: "" },
        slides: [],
        bentoCards: [],
      }));
  const curriculum = sourceLessons.map((lesson, index) => ({
    id: lesson.id || `module-${index + 1}`,
    title: lesson.title || `${input.title} — Modul ${index + 1}`,
    duration: estimatedTime,
  }));
  const lessons = sourceLessons.map((learningContent, index) => {
    const module = curriculum[index];
    const articleBody = learningContent.article.body || description;
    const firstCard = learningContent.bentoCards[0];
    return ({
    id: module.id,
    title: module.title,
    learningObjective: learningContent.learningObjective || input.landingDescription || description,
    bigPicture: articleBody.split(/\n\s*\n/)[0] || description,
    definition: firstCard?.content || `${input.title} adalah keterampilan praktis yang dipelajari melalui langkah terarah.`,
    whyItMatters: articleBody.split(/\n\s*\n/)[1] || input.landingDescription || description,
    analogy: `Pelajari ${input.title} seperti mengikuti peta: pahami arah, jalankan langkah, lalu evaluasi hasil.`,
    howItWorks: ["Pahami konsep utama.", "Terapkan langkah pada situasi nyata.", "Evaluasi dan perbaiki hasil."],
    visualType: "workflow",
    visualData: {
      title: "Alur Penerapan",
      steps: [
        { label: "Pahami", desc: "Kenali konsep dan tujuan." },
        { label: "Terapkan", desc: "Gunakan pada situasi nyata." },
        { label: "Evaluasi", desc: "Tinjau hasil dan perbaiki." },
      ],
    },
    realExample: `Terapkan ${input.title} pada satu situasi kerja atau aktivitas harian.`,
    commonMistakes: ["Melewati konsep dasar", "Tidak mengevaluasi hasil praktik"],
    keyTakeaway: input.landingDescription || description,
    checklist: ["Pahami tujuan", "Pilih situasi praktik", "Terapkan langkah", "Evaluasi hasil"],
    practiceChallenge: {
      title: `Praktik Modul ${index + 1}`,
      instruction: `Jelaskan bagaimana Anda akan menerapkan ${input.title}.`,
      sampleAnswer: "Saya akan memilih satu situasi, menerapkan langkahnya, lalu mengevaluasi hasil.",
    },
    reflectionPrompt: `Apa hal terpenting yang Anda pelajari dari modul ${index + 1}?`,
    summary: description,
    article: learningContent.article,
    audio: learningContent.audio,
    slides: learningContent.slides,
    bentoCards: learningContent.bentoCards,
  });
  });
  return {
    title: input.title,
    shortDescription: description,
    category: input.category || "Umum",
    price: input.price,
    coverUrl: input.image,
    digitalContent: input.digitalContent,
    label: input.label,
    landingHeadline: input.landingHeadline,
    landingDescription: input.landingDescription,
    estimatedTime,
    difficulty,
    author: "SkillPill Admin",
    problem: description,
    transformation: input.landingDescription || description,
    whyLearnThis: [input.landingDescription || description], evidence: "", testimonials: [], references: [], faq: [],
    curriculum,
    lessons,
    practice: [{
      id: "practice-1",
      title: `Praktik ${input.title}`,
      instruction: "Terapkan konsep pada satu situasi nyata.",
      scenario: input.landingDescription || description,
      interactiveType: "input",
      sampleAnswer: "Tuliskan konteks, langkah yang dipilih, dan hasil yang diharapkan.",
    }],
    reflection: [{
      id: "reflection-1",
      question: `Bagaimana ${input.title} dapat membantu aktivitas Anda?`,
      context: input.landingDescription || description,
      helperPrompt: "Hubungkan konsep dengan pengalaman atau kebutuhan Anda.",
    }],
    summary: description,
    actionPlan: [{ step: "Mulai praktik", description: `Terapkan satu langkah dari ${input.title}.`, timeline: "Hari ini" }],
    relatedSkills: [],
  };
}

export function SkillpillProvider({ children }: { children: ReactNode }) {
  const [apiSkills, setApiSkills] = useState<ApiSkill[]>([]);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    typeof window !== "undefined" && Boolean(window.localStorage.getItem(tokenKey)),
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(tokenKey);
    setIsAuthenticated(false);
    setApiSkills([]);
    setOrders([]);
    setUsers([]);
    setLeaderboard([]);
    setProfile(null);
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!window.localStorage.getItem(tokenKey)) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [nextSkills, profileData, nextUsers, nextLeaderboard, nextOrders] = await Promise.all([
        request<ApiSkill[]>("/api/skills"),
        request<{ profile: AdminProfile; orders: ApiOrder[] }>("/api/profile"),
        request<AdminUser[]>("/api/admin/users"),
        request<LeaderboardRow[]>("/api/leaderboard"),
        request<ApiOrder[]>("/api/admin/orders"),
      ]);
      setApiSkills(nextSkills);
      setProfile(profileData.profile);
      setOrders(nextOrders);
      setUsers(nextUsers);
      setLeaderboard(nextLeaderboard.filter((row) => row.user.role !== "admin"));
      setIsAuthenticated(true);
    } catch (reason) {
      if (reason instanceof Error && reason.message === "Sesi admin berakhir.") {
        window.localStorage.removeItem(tokenKey);
        setIsAuthenticated(false);
      }
      setError(reason instanceof Error ? reason.message : "Gagal memuat data SkillPill.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    let response: Response;
    try {
      response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      throw new Error(`Backend API tidak tersedia di ${apiBaseUrl}. Jalankan Laravel dengan: php artisan serve --port=8000`);
    }
    const body = await response.json().catch(() => null) as { token?: string; user?: { role?: string }; error?: string } | null;
    if (!response.ok || !body?.token) throw new Error(body?.error ?? "Email atau password admin salah.");
    if (body.user?.role !== "admin") throw new Error("Akun ini tidak memiliki akses dashboard admin.");
    window.localStorage.setItem(tokenKey, body.token);
    setIsAuthenticated(true);
    await refresh();
  }, [refresh]);

  useEffect(() => { void refresh(); }, [refresh]);

  const skills = useMemo(() => apiSkills.map((skill) => toAdminSkill(skill, orders)), [apiSkills, orders]);

  const value = useMemo<Store>(() => ({
    skills, orders, profile, users, leaderboard, isLoading, error, isAuthenticated, login, logout, refresh,
    createSkill: async (input) => {
      await request<ApiSkill>("/api/skills/manual", { method: "POST", body: JSON.stringify(createApiSkill(input)) });
      await refresh();
    },
    updateSkill: async (id, input) => {
      const current = apiSkills.find((skill) => skill.id === id);
      if (!current) throw new Error("Skill tidak ditemukan.");
      await request<ApiSkill>(`/api/skills/${id}`, { method: "PUT", body: JSON.stringify({ ...current, ...createApiSkill(input) }) });
      await refresh();
    },
    deleteSkill: async (id) => {
      await request<{ success: boolean }>(`/api/skills/${id}`, { method: "DELETE" });
      await refresh();
    },
    createUser: async (input) => {
      await request<AdminUser>("/api/admin/users", { method: "POST", body: JSON.stringify(input) });
      await refresh();
    },
    updateUser: async (id, input) => {
      const payload = { ...input };
      if (!payload.password) delete payload.password;
      await request<AdminUser>(`/api/admin/users/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      await refresh();
    },
    deleteUser: async (id) => {
      await request<{ success: boolean }>(`/api/admin/users/${id}`, { method: "DELETE" });
      await refresh();
    },
    updateOrderStatus: async (id, status) => {
      await request<ApiOrder>(`/api/admin/orders/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
      await refresh();
    },
  }), [apiSkills, error, isAuthenticated, isLoading, leaderboard, login, logout, orders, profile, refresh, skills, users]);

  return <SkillpillContext.Provider value={value}>{children}</SkillpillContext.Provider>;
}

export function useSkillpill() {
  const ctx = useContext(SkillpillContext);
  if (!ctx) throw new Error("useSkillpill must be used inside SkillpillProvider");
  return ctx;
}
