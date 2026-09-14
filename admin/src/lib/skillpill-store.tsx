import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  LearningLessonContent,
  LearningPractice,
  LearningReflection,
  Skill,
} from "./skillpill-data";

type SkillInput = Omit<
  Skill,
  "id" | "orders" | "revenue"
>;

type ApiSkillOverview = {
  headline?: string;
  description?: string;
  author?: string;
  problem?: string;
  transformation?: string;
  benefits?: string[];
  evidence?: string;
  testimonials?: unknown[];
  references?: unknown[];
  faq?: unknown[];
};

type ApiSkillLesson = {
  id?: string;
  title?: string;
  learningObjective?: string;

  article?: {
    title?: string;
    body?: string;
  };

  audio?: {
    title?: string;
    url?: string;
    transcript?: string;
    duration?: string;
  };

  slides?: unknown[];

  flashcards?: unknown[];
};

type ApiSkillSummary = {
  content?: string;
  reflection?: unknown[];
  actionPlan?: unknown[];
  relatedSkills?: string[];
};

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

  accessLevel?: Skill["accessLevel"];

  landingHeadline?: string;

  landingDescription?: string;

  transformation?: string;

  overview?: ApiSkillOverview;

  curriculum?: unknown[];

  isCustom?: boolean;

  lessons?: ApiSkillLesson[];

  practice?: unknown[];

  summary?: ApiSkillSummary | string;

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
  totalXp: number;
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
  plan: "free" | "pro";
  xp: number;
  completedSkills: number;
  user: AdminUser;
};

export type ApiOrder = {
  id: string;
  userId: string;

  items: Array<{
    skillId?: string;
    planKey?: "free" | "pro";
    title: string;
    price: number;
  }>;

  total: number;

  status:
    | "paid"
    | "pending"
    | "failed"
    | "expired"
    | "refunded";

  createdAt: string;
};

export type AdminReview = {
  id: number;
  userId: string;
  userName: string;
  userEmail: string;
  skillId: string;
  skillTitle: string;
  skillCategory?: string;
  rating: number;
  review: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminPlatformFeedback = {
  id: number;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  feedback: string;
  createdAt: string;
  updatedAt: string;
};

export type SkillpillPlan = {
  key: "free" | "pro";
  name: string;
  price: number;
  benefits: string[];
  isActive: boolean;
};

export type ContactSettings = {
  email: string | null;
  phone: string | null;
  address: string | null;
};

type Store = {
  skills: Skill[];

  orders: ApiOrder[];

  profile: AdminProfile | null;

  users: AdminUser[];

  reviews: AdminReview[];

  platformFeedback: AdminPlatformFeedback[];

  plans: SkillpillPlan[];

  contactSettings: ContactSettings;

  leaderboard: LeaderboardRow[];

  isLoading: boolean;

  error: string | null;

  isAuthenticated: boolean;

  login: (
    email: string,
    password: string,
  ) => Promise<void>;

  logout: () => void;

  refresh: () => Promise<void>;

  createSkill: (
    input: SkillInput,
  ) => Promise<void>;

  updateSkill: (
    id: string,
    input: SkillInput,
  ) => Promise<void>;

  deleteSkill: (
    id: string,
  ) => Promise<void>;

  createUser: (
    input: AdminUserInput & {
      password: string;
    },
  ) => Promise<void>;

  updateUser: (
    id: string,
    input: AdminUserInput,
  ) => Promise<void>;

  deleteUser: (
    id: string,
  ) => Promise<void>;

  deleteReview: (
    id: number,
  ) => Promise<void>;

  deletePlatformFeedback: (
    id: number,
  ) => Promise<void>;

  updatePlan: (
    key: SkillpillPlan["key"],
    input: Pick<SkillpillPlan, "name" | "price" | "benefits">,
  ) => Promise<void>;

  updateContactSettings: (
    input: ContactSettings,
  ) => Promise<void>;

  updateOrderStatus: (
    id: string,
    status: ApiOrder["status"],
  ) => Promise<void>;
};

const SkillpillContext =
  createContext<Store | null>(null);

const apiBaseUrl = (
  import.meta.env
    .VITE_SKILLPILL_API_URL ??
  "http://localhost:8000"
).replace(/\/$/, "");

const tokenKey = "skillpill-admin-jwt";

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token =
    window.localStorage.getItem(
      tokenKey,
    );

  if (!token) {
    throw new Error(
      "Sesi admin belum aktif.",
    );
  }

  const response = await fetch(
    `${apiBaseUrl}${path}`,
    {
      ...init,

      headers: {
        "Content-Type":
          "application/json",

        Authorization: `Bearer ${token}`,

        ...init?.headers,
      },
    },
  );

  if (response.status === 401) {
    window.localStorage.removeItem(
      tokenKey,
    );
  }

  if (!response.ok) {
    const body =
      (await response
        .json()
        .catch(() => null)) as {
        error?: string;
        message?: string;
        errors?: Record<
          string,
          string[]
        >;
      } | null;

    const validationError =
      body?.errors
        ? Object.values(body.errors)[0]?.[0]
        : null;

    throw new Error(
      response.status === 401
        ? "Sesi admin berakhir."
        : validationError ??
            body?.error ??
            body?.message ??
            "Tidak dapat menghubungi layanan SkillPill.",
    );
  }

  return response.json() as Promise<T>;
}

function normalizePractice(
  value: unknown,
): LearningPractice[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      if (
        typeof item !== "object" ||
        item === null
      ) {
        return null;
      }

      const data =
        item as Record<
          string,
          unknown
        >;

      const interactiveType =
        data.interactiveType ===
          "multiple-choice" ||
        data.interactiveType ===
          "checklist" ||
        data.interactiveType ===
          "input"
          ? data.interactiveType
          : "input";

      return {
        id:
          typeof data.id === "string"
            ? data.id
            : `practice-${index + 1}`,

        title:
          typeof data.title === "string"
            ? data.title
            : "",

        instruction:
          typeof data.instruction ===
          "string"
            ? data.instruction
            : "",

        scenario:
          typeof data.scenario ===
          "string"
            ? data.scenario
            : "",

        interactiveType,

        options:
          Array.isArray(
            data.options,
          )
            ? data.options.filter(
                (
                  option,
                ): option is string =>
                  typeof option ===
                  "string",
              )
            : [],

        correctOption:
          typeof data.correctOption ===
          "string"
            ? data.correctOption
            : "",

        checklistItems:
          Array.isArray(
            data.checklistItems,
          )
            ? data.checklistItems.filter(
                (
                  item,
                ): item is string =>
                  typeof item ===
                  "string",
              )
            : [],

        sampleAnswer:
          typeof data.sampleAnswer ===
          "string"
            ? data.sampleAnswer
            : "",
      };
    })
    .filter(
      (
        item,
      ): item is LearningPractice =>
        item !== null,
    );
}

function normalizeReflection(
  value: unknown,
): LearningReflection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      if (
        typeof item !== "object" ||
        item === null
      ) {
        return null;
      }

      const data =
        item as Record<
          string,
          unknown
        >;

      return {
        id:
          typeof data.id === "string"
            ? data.id
            : `reflection-${index + 1}`,

        question:
          typeof data.question ===
          "string"
            ? data.question
            : "",

        context:
          typeof data.context ===
          "string"
            ? data.context
            : "",

        helperPrompt:
          typeof data.helperPrompt ===
          "string"
            ? data.helperPrompt
            : "",
      };
    })
    .filter(
      (
        item,
      ): item is LearningReflection =>
        item !== null,
    );
}

function normalizeLessons(
  value: unknown,
): LearningLessonContent[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      if (
        typeof item !== "object" ||
        item === null
      ) {
        return null;
      }

      const lesson =
        item as ApiSkillLesson;

      const normalized: LearningLessonContent =
        {
          id:
            typeof lesson.id === "string"
              ? lesson.id
              : `lesson-${index + 1}`,

          title:
            typeof lesson.title ===
            "string"
              ? lesson.title
              : "",

          learningObjective:
            typeof lesson.learningObjective ===
            "string"
              ? lesson.learningObjective
              : undefined,
        };

      if (
        lesson.article &&
        typeof lesson.article ===
          "object"
      ) {
        normalized.article = {
          title:
            typeof lesson.article.title ===
            "string"
              ? lesson.article.title
              : "",

          body:
            typeof lesson.article.body ===
            "string"
              ? lesson.article.body
              : "",
        };
      }

      if (
        lesson.audio &&
        typeof lesson.audio ===
          "object"
      ) {
        normalized.audio = {
          title:
            typeof lesson.audio.title ===
            "string"
              ? lesson.audio.title
              : "",

          url:
            typeof lesson.audio.url ===
            "string"
              ? lesson.audio.url
              : "",

          transcript:
            typeof lesson.audio
              .transcript === "string"
              ? lesson.audio.transcript
              : "",

          duration:
            typeof lesson.audio
              .duration === "string"
              ? lesson.audio.duration
              : "",
        };
      }

      if (
        Array.isArray(
          lesson.slides,
        )
      ) {
        normalized.slides =
          lesson.slides
            .filter(
              (
                slide,
              ): slide is Record<
                string,
                unknown
              > =>
                typeof slide ===
                  "object" &&
                slide !== null,
            )
            .map(
              (
                slide,
                slideIndex,
              ) => ({
                id:
                  typeof slide.id ===
                  "string"
                    ? slide.id
                    : `slide-${
                        slideIndex + 1
                      }`,

                title:
                  typeof slide.title ===
                  "string"
                    ? slide.title
                    : "",

                body:
                  typeof slide.body ===
                  "string"
                    ? slide.body
                    : "",

                bullets:
                  Array.isArray(
                    slide.bullets,
                  )
                    ? slide.bullets.filter(
                        (
                          bullet,
                        ): bullet is string =>
                          typeof bullet ===
                          "string",
                      )
                    : [],

                speakerNotes:
                  typeof slide.speakerNotes ===
                  "string"
                    ? slide.speakerNotes
                    : "",

                imageUrl:
                  typeof slide.imageUrl ===
                  "string"
                    ? slide.imageUrl
                    : "",
              }),
            );
      }

      if (
        Array.isArray(
          lesson.flashcards,
        )
      ) {
        normalized.flashcards =
          lesson.flashcards
            .filter(
              (
                card,
              ): card is Record<
                string,
                unknown
              > =>
                typeof card ===
                  "object" &&
                card !== null,
            )
            .map(
              (
                card,
                cardIndex,
              ) => ({
                id:
                  typeof card.id ===
                  "string"
                    ? card.id
                    : `flashcard-${
                        cardIndex + 1
                      }`,

                question:
                  typeof card.question ===
                  "string"
                    ? card.question
                    : "",

                answer:
                  typeof card.answer ===
                  "string"
                    ? card.answer
                    : "",
              }),
            );
      }

      return normalized;
    })
    .filter(
      (
        lesson,
      ): lesson is LearningLessonContent =>
        lesson !== null,
    );
}

function toAdminSkill(
  skill: ApiSkill,
  orders: ApiOrder[],
): Skill {
  const matchingOrders =
    orders.filter(
      (order) =>
        order.status === "paid" &&
        order.items.some(
          (item) =>
            item.skillId === skill.id,
        ),
    );

  const revenue =
    matchingOrders.reduce(
      (total, order) =>
        total +
        order.items
          .filter(
            (item) =>
              item.skillId === skill.id,
          )
          .reduce(
            (
              itemTotal,
              item,
            ) =>
              itemTotal +
              item.price,
            0,
          ),
      0,
    );

  const lessons =
    normalizeLessons(
      skill.lessons,
    );

  const summary =
    typeof skill.summary ===
      "object" &&
    skill.summary !== null
      ? skill.summary
      : null;

  const overview =
    skill.overview;

  return {
    id: skill.id,

    title: skill.title,

    image: skill.coverUrl ?? "",

    price: skill.price,

    label:
      skill.label ??
      (skill.isCustom
        ? "Baru"
        : "Bestseller"),

    category: skill.category,

    accessLevel: skill.accessLevel === "pro" ? "pro" : "all",

    digitalContent:
      skill.digitalContent ??
      `${lessons.length} lesson · ${
        skill.estimatedTime ??
        "20 mins"
      } · ${
        skill.difficulty ??
        "Beginner"
      }`,

    overview: {
      headline:
        overview?.headline ??
        skill.landingHeadline ??
        skill.shortDescription,

      description:
        overview?.description ??
        skill.landingDescription ??
        skill.transformation ??
        "",

      author:
        overview?.author ?? "",

      problem:
        overview?.problem,

      transformation:
        overview?.transformation,

      benefits:
        overview?.benefits ?? [],

      evidence:
        overview?.evidence,

      testimonials:
        overview?.testimonials ?? [],

      references:
        overview?.references ?? [],

      faq:
        overview?.faq ?? [],
    },

    lessons,

    practice:
      normalizePractice(
        skill.practice,
      ),

    summary: {
      content:
        summary?.content ??
        (typeof skill.summary ===
        "string"
          ? skill.summary
          : ""),

      reflection:
        normalizeReflection(
          summary?.reflection ?? skill.reflection,
        ),

      actionPlan:
        summary?.actionPlan ?? [],

      relatedSkills:
        summary?.relatedSkills ?? [],
    },

    orders:
      matchingOrders.length,

    revenue,
  };
}

function createApiSkill(
  input: SkillInput,
): Omit<ApiSkill, "id"> {
  const detailParts =
    input.digitalContent.split(
      /\s*(?:•|·)\s*/,
    );

  const estimatedTime =
    detailParts[1] ??
    "20 mins";

  const difficulty =
    detailParts[2] ??
    "Beginner";

  return {
    title: input.title,

    shortDescription:
      input.overview.headline,

    category:
      input.category || "Umum",

    price: input.price,

    accessLevel: input.accessLevel,

    coverUrl: input.image,

    digitalContent:
      input.digitalContent,

    label: input.label,

    landingHeadline:
      input.overview.headline,

    landingDescription:
      input.overview.description,

    estimatedTime,

    difficulty,

    overview: {
      ...input.overview,

      headline:
        input.overview.headline,

      description:
        input.overview.description,
    },

    lessons: input.lessons,

    practice: input.practice,

    summary: input.summary,
  };
}

export function SkillpillProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [apiSkills, setApiSkills] =
    useState<ApiSkill[]>([]);

  const [orders, setOrders] =
    useState<ApiOrder[]>([]);

  const [profile, setProfile] =
    useState<AdminProfile | null>(
      null,
    );

  const [users, setUsers] =
    useState<AdminUser[]>([]);

  const [reviews, setReviews] =
    useState<AdminReview[]>([]);

  const [platformFeedback, setPlatformFeedback] =
    useState<AdminPlatformFeedback[]>([]);

  const [plans, setPlans] =
    useState<SkillpillPlan[]>([]);

  const [contactSettings, setContactSettings] =
    useState<ContactSettings>({ email: null, phone: null, address: null });

  const [leaderboard, setLeaderboard] =
    useState<LeaderboardRow[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [
    isAuthenticated,
    setIsAuthenticated,
  ] = useState(() =>
    typeof window !==
      "undefined" &&
    Boolean(
      window.localStorage.getItem(
        tokenKey,
      ),
    ),
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(
      tokenKey,
    );

    setIsAuthenticated(false);

    setApiSkills([]);

    setOrders([]);

    setUsers([]);

    setReviews([]);

    setPlatformFeedback([]);

    setPlans([]);

    setContactSettings({ email: null, phone: null, address: null });

    setLeaderboard([]);

    setProfile(null);

    setError(null);
  }, []);

  const refresh = useCallback(
    async () => {
      if (
        !window.localStorage.getItem(
          tokenKey,
        )
      ) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [
          nextSkills,
          profileData,
          nextUsers,
          nextLeaderboard,
          nextOrders,
          nextReviews,
          nextPlatformFeedback,
          nextPlans,
          nextContactSettings,
        ] = await Promise.all([
          request<ApiSkill[]>(
            "/api/skills",
          ),

          request<{
            profile: AdminProfile;
            orders: ApiOrder[];
          }>("/api/profile"),

          request<AdminUser[]>(
            "/api/admin/users",
          ),

          request<LeaderboardRow[]>(
            "/api/leaderboard",
          ),

          request<ApiOrder[]>(
            "/api/admin/orders",
          ),

          request<AdminReview[]>(
            "/api/admin/reviews",
          ),

          request<AdminPlatformFeedback[]>(
            "/api/admin/platform-feedback",
          ),

          request<SkillpillPlan[]>(
            "/api/admin/plans",
          ),

          request<ContactSettings>(
            "/api/admin/contact-settings",
          ),
        ]);

        setApiSkills(nextSkills);

        setProfile(
          profileData.profile,
        );

        setOrders(nextOrders);

        setUsers(nextUsers);

        setReviews(nextReviews);

        setPlatformFeedback(nextPlatformFeedback);

        setPlans(nextPlans);

        setContactSettings(nextContactSettings);

        setLeaderboard(
          nextLeaderboard.filter(
            (row) =>
              row.user.role !==
              "admin",
          ),
        );

        setIsAuthenticated(true);
      } catch (reason) {
        if (
          reason instanceof
            Error &&
          reason.message ===
            "Sesi admin berakhir."
        ) {
          window.localStorage.removeItem(
            tokenKey,
          );

          setIsAuthenticated(
            false,
          );
        }

        setError(
          reason instanceof Error
            ? reason.message
            : "Gagal memuat data SkillPill.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const login = useCallback(
    async (
      email: string,
      password: string,
    ) => {
      let response: Response;

      try {
        response = await fetch(
          `${apiBaseUrl}/api/auth/login`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email,
              password,
            }),
          },
        );
      } catch {
        throw new Error(
          "Layanan admin belum dapat dihubungi. Silakan coba lagi.",
        );
      }

      const body =
        (await response
          .json()
          .catch(
            () => null,
          )) as {
          token?: string;
          user?: {
            role?: string;
          };
          error?: string;
        } | null;

      if (
        !response.ok ||
        !body?.token
      ) {
        throw new Error(
          body?.error ??
            "Email atau password admin salah.",
        );
      }

      if (
        body.user?.role !==
        "admin"
      ) {
        throw new Error(
          "Akun ini tidak memiliki akses dashboard admin.",
        );
      }

      window.localStorage.setItem(
        tokenKey,
        body.token,
      );

      setIsAuthenticated(true);

      await refresh();
    },
    [refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const skills = useMemo(
    () =>
      apiSkills.map((skill) =>
        toAdminSkill(
          skill,
          orders,
        ),
      ),
    [apiSkills, orders],
  );

  const value = useMemo<Store>(
    () => ({
      skills,

      orders,

      profile,

      users,

      reviews,

      platformFeedback,

      plans,

      contactSettings,

      leaderboard,

      isLoading,

      error,

      isAuthenticated,

      login,

      logout,

      refresh,

      createSkill:
        async (input) => {
          await request<ApiSkill>(
            "/api/skills/manual",
            {
              method: "POST",

              body: JSON.stringify(
                createApiSkill(
                  input,
                ),
              ),
            },
          );

          await refresh();
        },

      updateSkill:
        async (
          id,
          input,
        ) => {
          const current =
            apiSkills.find(
              (skill) =>
                skill.id === id,
            );

          if (!current) {
            throw new Error(
              "Skill tidak ditemukan.",
            );
          }

          await request<ApiSkill>(
            `/api/skills/${id}`,
            {
              method: "PUT",

              body: JSON.stringify({
                ...current,

                ...createApiSkill(
                  input,
                ),
              }),
            },
          );

          await refresh();
        },

      deleteSkill:
        async (id) => {
          await request<{
            success: boolean;
          }>(
            `/api/skills/${id}`,
            {
              method: "DELETE",
            },
          );

          await refresh();
        },

      createUser:
        async (input) => {
          await request<AdminUser>(
            "/api/admin/users",
            {
              method: "POST",

              body: JSON.stringify(
                input,
              ),
            },
          );

          await refresh();
        },

      updateUser:
        async (
          id,
          input,
        ) => {
          const payload = {
            ...input,
          };

          if (
            !payload.password
          ) {
            delete payload.password;
          }

          await request<AdminUser>(
            `/api/admin/users/${id}`,
            {
              method: "PUT",

              body: JSON.stringify(
                payload,
              ),
            },
          );

          await refresh();
        },

      deleteUser:
        async (id) => {
          await request<{
            success: boolean;
          }>(
            `/api/admin/users/${id}`,
            {
              method: "DELETE",
            },
          );

          await refresh();
        },

      deleteReview:
        async (id) => {
          await request<{
            success: boolean;
          }>(
            `/api/admin/reviews/${id}`,
            {
              method: "DELETE",
            },
          );

          await refresh();
        },

      deletePlatformFeedback:
        async (id) => {
          await request<{
            success: boolean;
          }>(
            `/api/admin/platform-feedback/${id}`,
            {
              method: "DELETE",
            },
          );

          await refresh();
        },

      updatePlan:
        async (key, input) => {
          await request<SkillpillPlan>(
            `/api/admin/plans/${key}`,
            {
              method: "PUT",
              body: JSON.stringify(input),
            },
          );

          await refresh();
        },

      updateContactSettings:
        async (input) => {
          await request<ContactSettings>(
            "/api/admin/contact-settings",
            {
              method: "PUT",
              body: JSON.stringify(input),
            },
          );

          await refresh();
        },

      updateOrderStatus:
        async (
          id,
          status,
        ) => {
          await request<ApiOrder>(
            `/api/admin/orders/${id}`,
            {
              method: "PUT",

              body: JSON.stringify({
                status,
              }),
            },
          );

          await refresh();
        },
    }),
    [
      apiSkills,
      error,
      isAuthenticated,
      isLoading,
      leaderboard,
      login,
      logout,
      orders,
      profile,
      refresh,
      skills,
      users,
      reviews,
      platformFeedback,
      plans,
      contactSettings,
    ],
  );

  return (
    <SkillpillContext.Provider
      value={value}
    >
      {children}
    </SkillpillContext.Provider>
  );
}

export function useSkillpill() {
  const ctx =
    useContext(
      SkillpillContext,
    );

  if (!ctx) {
    throw new Error(
      "useSkillpill must be used inside SkillpillProvider",
    );
  }

  return ctx;
}
