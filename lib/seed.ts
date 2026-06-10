import type {
  ActivityEvent,
  AppNotification,
  ChatSession,
  Flow,
  KnowledgeArticle,
  OnboardingTask,
  PortalState,
  Ticket,
  User
} from "./types";
import { progressFor, resolveFlow, ticketStatusFor } from "./flow";

const today = new Date();
const day = (offset: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString();
};
const at = (offset: number, h: number, m: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

const users: User[] = [
  {
    id: "u_hr_director",
    fullName: "Айгерим Сатпаева",
    email: "a.satpayeva@kmg.kz",
    role: "hr",
    position: "Директор по управлению персоналом",
    department: "HR",
    avatarSeed: "satpayeva",
    startDate: "2018-04-12"
  },
  {
    id: "u_hr_lead",
    fullName: "Нурлан Жумабаев",
    email: "n.zhumabayev@kmg.kz",
    role: "hr",
    position: "Руководитель onboarding-программ",
    department: "HR",
    avatarSeed: "zhumabayev",
    startDate: "2020-09-01"
  },
  {
    id: "u_emp_geo",
    fullName: "Асылбек Гизатов",
    email: "a.gizatov@kmg.kz",
    role: "employee",
    position: "Геолог-аналитик",
    department: "Разведка и добыча",
    avatarSeed: "gizatov",
    startDate: day(-3),
    managerId: "u_hr_lead"
  },
  {
    id: "u_emp_eng",
    fullName: "Алия Бектурова",
    email: "a.bekturova@kmg.kz",
    role: "employee",
    position: "Инженер по автоматизации",
    department: "Цифровая трансформация",
    avatarSeed: "bekturova",
    startDate: day(-7),
    managerId: "u_hr_lead"
  },
  {
    id: "u_emp_fin",
    fullName: "Олжас Смагулов",
    email: "o.smagulov@kmg.kz",
    role: "employee",
    position: "Финансовый аналитик",
    department: "Финансы и казначейство",
    avatarSeed: "smagulov",
    startDate: day(-12),
    managerId: "u_hr_director"
  }
];

const baseFlow = (
  prefix: string,
  steps: { title: string; description: string; type: "task" | "approval" | "milestone"; role?: "hr" | "employee"; days?: number; status?: "pending" | "active" | "done" | "blocked"; resources?: { label: string; url?: string }[] }[]
): Flow => {
  const nodes = [
    {
      id: `${prefix}-start`,
      type: "start" as const,
      title: "Старт онбординга",
      description: "Триггер: подписан оффер",
      position: { x: 80, y: 220 }
    },
    ...steps.map((step, index) => ({
      id: `${prefix}-${index + 1}`,
      type: step.type,
      title: step.title,
      description: step.description,
      assigneeRole: step.role,
      estimateDays: step.days ?? 1,
      status: step.status ?? (index === 0 ? "active" : "pending"),
      resources: step.resources,
      position: { x: 80 + (index + 1) * 260, y: index % 2 === 0 ? 140 : 300 }
    })),
    {
      id: `${prefix}-end`,
      type: "end" as const,
      title: "Готов к работе",
      description: "Этап адаптации завершён",
      position: { x: 80 + (steps.length + 1) * 260, y: 220 }
    }
  ];

  const edges = [
    { id: `${prefix}-e0`, source: `${prefix}-start`, target: `${prefix}-1`, variant: "default" as const },
    ...steps.slice(0, -1).map((_, i) => ({
      id: `${prefix}-e${i + 1}`,
      source: `${prefix}-${i + 1}`,
      target: `${prefix}-${i + 2}`,
      variant: "default" as const
    })),
    {
      id: `${prefix}-eEnd`,
      source: `${prefix}-${steps.length}`,
      target: `${prefix}-end`,
      variant: "success" as const
    }
  ];

  return { nodes, edges };
};

const tickets: Ticket[] = [
  {
    id: "t_docs_001",
    code: "ONB-1042",
    title: "Документы и подписание NDA",
    summary: "Сбор пакета документов, подписание трудового договора и NDA, заведение в 1С.",
    category: "documents",
    priority: "high",
    status: "in_progress",
    assigneeId: "u_emp_geo",
    ownerId: "u_hr_lead",
    badges: [
      { label: "День 1-3", tone: "navy" },
      { label: "Обязательный", tone: "gold" }
    ],
    dueDate: day(2),
    createdAt: day(-4),
    updatedAt: day(-1),
    progress: 60,
    tags: ["документы", "1С", "комплаенс"],
    flow: baseFlow("docs", [
      {
        title: "Загрузить скан удостоверения",
        description: "Сотрудник загружает удостоверение личности через личный кабинет.",
        type: "task",
        role: "employee",
        days: 1,
        status: "done",
        resources: [{ label: "Чек-лист документов", url: "/knowledge/docs-checklist" }]
      },
      {
        title: "Проверка отделом кадров",
        description: "HR валидирует подлинность и комплектность.",
        type: "approval",
        role: "hr",
        days: 1,
        status: "active"
      },
      {
        title: "Подписание трудового договора",
        description: "Электронная подпись через KMG eSign.",
        type: "task",
        role: "employee",
        days: 1,
        status: "pending",
        resources: [{ label: "Инструкция KMG eSign" }]
      },
      {
        title: "Заведение в 1С",
        description: "Кадровик создаёт карточку и присваивает табельный номер.",
        type: "task",
        role: "hr",
        days: 1,
        status: "pending"
      },
      {
        title: "Документы готовы",
        description: "Все исходные документы загружены и подписаны.",
        type: "milestone",
        days: 0,
        status: "pending"
      }
    ])
  },
  {
    id: "t_access_002",
    code: "ONB-1043",
    title: "Доступы и корпоративный аккаунт",
    summary: "Выдача учётной записи, VPN, доступа к SAP, GIS-системам и корпоративной почте.",
    category: "access",
    priority: "high",
    status: "in_progress",
    assigneeId: "u_emp_eng",
    ownerId: "u_hr_lead",
    badges: [
      { label: "День 1-5", tone: "navy" },
      { label: "ИТ", tone: "info" }
    ],
    dueDate: day(4),
    createdAt: day(-6),
    updatedAt: day(-1),
    progress: 40,
    tags: ["ИТ", "доступы", "SAP"],
    flow: baseFlow("access", [
      {
        title: "Заявка на учётную запись",
        description: "HR создаёт заявку в Service Desk.",
        type: "task",
        role: "hr",
        days: 1,
        status: "done"
      },
      {
        title: "Создание учётной записи AD",
        description: "ИТ выдаёт логин и временный пароль.",
        type: "task",
        days: 1,
        status: "done"
      },
      {
        title: "Подписание соглашения о конфиденциальности",
        description: "Сотрудник подписывает соглашение перед получением доступов.",
        type: "approval",
        role: "employee",
        days: 1,
        status: "active"
      },
      {
        title: "Выдача доступа к SAP / GIS",
        description: "Профильный администратор настраивает роли.",
        type: "task",
        days: 2,
        status: "pending"
      },
      {
        title: "Проверка доступов сотрудником",
        description: "Сотрудник логинится и подтверждает работоспособность.",
        type: "task",
        role: "employee",
        days: 1,
        status: "pending"
      }
    ])
  },
  {
    id: "t_train_003",
    code: "ONB-1044",
    title: "Обязательное обучение и HSE",
    summary: "Курс по охране труда, антикоррупционная политика и цифровой этикет KMG.",
    category: "training",
    priority: "medium",
    status: "review",
    assigneeId: "u_emp_geo",
    ownerId: "u_hr_director",
    badges: [
      { label: "Неделя 1-2", tone: "navy" },
      { label: "HSE", tone: "warning" }
    ],
    dueDate: day(9),
    createdAt: day(-5),
    updatedAt: day(-1),
    progress: 75,
    tags: ["обучение", "HSE", "комплаенс"],
    flow: baseFlow("train", [
      {
        title: "Курс «Безопасность на производстве»",
        description: "Лонгрид + видео + финальный тест.",
        type: "task",
        role: "employee",
        days: 2,
        status: "done"
      },
      {
        title: "Антикоррупционная политика",
        description: "Изучение кодекса деловой этики KMG.",
        type: "task",
        role: "employee",
        days: 1,
        status: "done"
      },
      {
        title: "Тренинг по информационной безопасности",
        description: "Интерактивный модуль + тест.",
        type: "task",
        role: "employee",
        days: 1,
        status: "active"
      },
      {
        title: "Подтверждение тренером",
        description: "Куратор отмечает завершение и закрывает раздел.",
        type: "approval",
        role: "hr",
        days: 1,
        status: "pending"
      }
    ])
  },
  {
    id: "t_eq_004",
    code: "ONB-1045",
    title: "Рабочее место и оборудование",
    summary: "Выдача ноутбука, СИЗ, корпоративного телефона и брендированных аксессуаров.",
    category: "equipment",
    priority: "medium",
    status: "in_progress",
    assigneeId: "u_emp_eng",
    ownerId: "u_hr_lead",
    badges: [
      { label: "День 1-2", tone: "navy" },
      { label: "АХО", tone: "info" }
    ],
    dueDate: day(1),
    createdAt: day(-7),
    updatedAt: day(-2),
    progress: 50,
    tags: ["оборудование", "АХО", "СИЗ"],
    flow: baseFlow("equip", [
      {
        title: "Подготовка ноутбука",
        description: "ИТ настраивает образ и софт.",
        type: "task",
        days: 1,
        status: "done"
      },
      {
        title: "Выдача СИЗ",
        description: "Каска, спецодежда, обувь по чек-листу HSE.",
        type: "task",
        days: 1,
        status: "active"
      },
      {
        title: "Welcome-pack",
        description: "Брендированные аксессуары и приветственный буклет.",
        type: "task",
        role: "hr",
        days: 1,
        status: "pending"
      }
    ])
  },
  {
    id: "t_mentor_005",
    code: "ONB-1046",
    title: "Знакомство с командой и наставник",
    summary: "Встречи 1:1, представление команды, закрепление наставника на 90 дней.",
    category: "mentorship",
    priority: "low",
    status: "draft",
    assigneeId: "u_emp_fin",
    ownerId: "u_hr_director",
    badges: [
      { label: "Неделя 1", tone: "navy" },
      { label: "Soft", tone: "gold" }
    ],
    dueDate: day(6),
    createdAt: day(-3),
    updatedAt: day(-1),
    progress: 20,
    tags: ["команда", "наставник", "культура"],
    flow: baseFlow("mentor", [
      {
        title: "Welcome-встреча",
        description: "Знакомство с руководителем и командой.",
        type: "task",
        role: "hr",
        days: 1,
        status: "done"
      },
      {
        title: "Закрепление наставника",
        description: "HR подбирает ментора по компетенциям.",
        type: "task",
        role: "hr",
        days: 2,
        status: "active"
      },
      {
        title: "План 30/60/90",
        description: "Сотрудник и наставник согласовывают цели.",
        type: "task",
        role: "employee",
        days: 3,
        status: "pending"
      }
    ])
  },
  {
    id: "t_comp_006",
    code: "ONB-1047",
    title: "Комплаенс и подписание политик",
    summary: "Антикоррупционные декларации, конфликт интересов, COI-форма.",
    category: "compliance",
    priority: "critical",
    status: "blocked",
    assigneeId: "u_emp_fin",
    ownerId: "u_hr_director",
    badges: [
      { label: "До 7 дней", tone: "danger" },
      { label: "Комплаенс", tone: "warning" }
    ],
    dueDate: day(3),
    createdAt: day(-2),
    updatedAt: day(-1),
    progress: 10,
    tags: ["комплаенс", "COI", "этика"],
    flow: baseFlow("comp", [
      {
        title: "Изучение политик",
        description: "Сотрудник изучает 4 политики KMG.",
        type: "task",
        role: "employee",
        days: 1,
        status: "active"
      },
      {
        title: "Подписание COI",
        description: "Заполнение и подпись формы конфликта интересов.",
        type: "approval",
        role: "employee",
        days: 1,
        status: "pending"
      },
      {
        title: "Проверка комплаенс-офицером",
        description: "Compliance officer проверяет и архивирует.",
        type: "approval",
        days: 2,
        status: "pending"
      }
    ])
  },
  {
    id: "t_badge_007",
    code: "ONB-1048",
    title: "Бейдж и пропускной режим",
    summary:
      "Генерация корпоративного бейджа по документам (согласие, служебная записка, удостоверение, фото 3×4) и выдача сотруднику. Процесс: HR → Badge Center.",
    category: "access",
    priority: "high",
    status: "in_progress",
    assigneeId: "u_emp_geo",
    ownerId: "u_hr_lead",
    badges: [
      { label: "День 1-2", tone: "navy" },
      { label: "ДКБ", tone: "info" }
    ],
    dueDate: day(2),
    createdAt: day(-1),
    updatedAt: day(0),
    progress: 0,
    tags: ["badge", "пропуск", "ДКБ"],
    flow: baseFlow("badge", [
      {
        title: "Сгенерировать бейдж в Badge Center",
        description: "Загрузить согласие, служебную записку, удостоверение и фото 3×4 (или нажать «Заполнить демо») и сгенерировать бейдж.",
        type: "task",
        role: "hr",
        days: 1,
        status: "active",
        resources: [{ label: "Открыть Badge Center", url: "/hr/badge" }]
      },
      {
        title: "Печать и выдача бейджа",
        description: "Распечатать готовый бейдж и выдать новому сотруднику.",
        type: "task",
        role: "hr",
        days: 1,
        status: "pending"
      }
    ])
  }
];

// Приводим стартовые статусы узлов к модели зависимостей (gating): «готово» берём
// из авторских статусов, остальное вычисляем — доступно (active) / заблокировано (pending).
const resolvedTickets: Ticket[] = tickets.map((t) => {
  const done = new Set(t.flow.nodes.filter((n) => n.status === "done").map((n) => n.id));
  const flow = resolveFlow(t.flow, done);
  const progress = progressFor(flow, done);
  return { ...t, flow, progress, status: ticketStatusFor(progress, t.status) };
});

const tasks: OnboardingTask[] = resolvedTickets.flatMap((ticket) =>
  ticket.flow.nodes
    .filter((node) => node.type === "task" || node.type === "approval")
    .map((node) => ({
      id: `${ticket.id}_${node.id}`,
      ticketId: ticket.id,
      nodeId: node.id,
      title: node.title,
      description: node.description,
      status:
        node.status === "done"
          ? ("done" as const)
          : node.status === "active"
            ? ("in_progress" as const)
            : ("pending" as const),
      dueDate: ticket.dueDate
    }))
);

const knowledge: KnowledgeArticle[] = [
  {
    id: "k_welcome",
    title: "Добро пожаловать в KMG",
    category: "Культура",
    excerpt:
      "Гайд для нового сотрудника: миссия, ценности и структура группы компаний КазМунайГаз.",
    content:
      "KMG — национальный оператор Казахстана в нефтегазовой отрасли. Группа объединяет более 50 дочерних предприятий, охватывает весь цикл от разведки до переработки. Наши ценности — безопасность, ответственность, прозрачность, эффективность и развитие людей. Каждый новый сотрудник проходит структурированную программу адаптации из 6 ключевых треков...",
    tags: ["culture", "intro", "values"],
    updatedAt: day(-30)
  },
  {
    id: "k_docs",
    title: "Чек-лист документов первого дня",
    category: "Документы",
    excerpt:
      "Полный список документов, необходимых при выходе на работу, со ссылками на бланки.",
    content:
      "Документы: удостоверение личности, ИИН, СИК, диплом, военный билет (для м.), документы об образовании, медицинская справка форма 086, фото 3x4. Все сканы загружаются в личный кабинет в формате PDF. Оригиналы предъявляются специалисту HR в первый рабочий день в офисе на ул. Кабанбай батыра, 19.",
    tags: ["docs", "checklist"],
    updatedAt: day(-15)
  },
  {
    id: "k_access",
    title: "Как получить доступ к SAP и GIS",
    category: "ИТ",
    excerpt:
      "Шаги получения корпоративных доступов: AD, VPN, SAP, GIS и корпоративный email.",
    content:
      "После создания учётной записи в Active Directory вы получите письмо на личный e-mail с временным паролем. Установите VPN-клиент Cisco AnyConnect (https://it.kmg.kz/vpn), пройдите MFA-регистрацию. Заявка на SAP создаётся через ServiceDesk, согласовывается руководителем и владельцем модуля.",
    tags: ["it", "sap", "vpn"],
    updatedAt: day(-7)
  },
  {
    id: "k_hse",
    title: "Базовые правила HSE на объектах KMG",
    category: "HSE",
    excerpt:
      "Кратко о требованиях по охране труда и промышленной безопасности.",
    content:
      "На производственных объектах обязательны: каска, защитные очки, спецобувь и сигнальный жилет. Перед посещением месторождения сотрудник проходит инструктаж и оформляет наряд-допуск. В случае инцидента — звонок на 112 и в дежурную HSE-службу +7 (7172) 78 96 12.",
    tags: ["hse", "safety"],
    updatedAt: day(-10)
  },
  {
    id: "k_policy_ai",
    title: "Политика использования AI-сервисов",
    category: "Комплаенс",
    excerpt: "Что можно и что нельзя загружать в корпоративный AI-ассистент KMG.",
    content:
      "AI-ассистент KMG работает в защищённом контуре. Запрещено загружать персональные данные клиентов, коммерческую тайну партнёров без NDA, исходные коды критических систем. Разрешено: внутренние политики, обучающие материалы, нормативные документы. Все запросы логируются для compliance-аудита.",
    tags: ["compliance", "ai", "policy"],
    updatedAt: day(-3)
  },
  {
    id: "k_mentor",
    title: "Программа менторства 30/60/90",
    category: "Развитие",
    excerpt:
      "Как работает наставничество в KMG: цели, форматы, чек-поинты.",
    content:
      "За каждым новым сотрудником закрепляется наставник на 90 дней. Контрольные точки на 30, 60 и 90 день: цели согласовываются в первую неделю и фиксируются в карточке сотрудника. Наставник проводит 1:1 еженедельно и оставляет фидбэк в системе.",
    tags: ["mentor", "development"],
    updatedAt: day(-20)
  }
];

const activity: ActivityEvent[] = [
  {
    id: "a1",
    actorId: "u_hr_lead",
    actorName: "Нурлан Жумабаев",
    message: "Назначил тикет ONB-1042 на Асылбека Гизатова",
    type: "ticket",
    createdAt: day(-1),
    meta: { ticket: "ONB-1042" }
  },
  {
    id: "a2",
    actorId: "u_emp_geo",
    actorName: "Асылбек Гизатов",
    message: "Загрузил скан удостоверения личности",
    type: "task",
    createdAt: day(-1),
    meta: { ticket: "ONB-1042" }
  },
  {
    id: "a3",
    actorId: "u_emp_eng",
    actorName: "Алия Бектурова",
    message: "Завершила тренинг по информационной безопасности",
    type: "task",
    createdAt: day(0),
    meta: { ticket: "ONB-1044" }
  },
  {
    id: "a4",
    actorId: "u_hr_director",
    actorName: "Айгерим Сатпаева",
    message: "Заблокировала тикет ONB-1047 — требуется уточнение по COI",
    type: "ticket",
    createdAt: day(0),
    meta: { ticket: "ONB-1047" }
  },
  {
    id: "a5",
    actorId: "system",
    actorName: "Система",
    message: "RAG-индекс обновлён: добавлено 3 документа из базы знаний",
    type: "system",
    createdAt: day(0)
  }
];

const chats: ChatSession[] = [
  {
    id: "chat_geo",
    userId: "u_emp_geo",
    title: "Как оформить доступ к GIS?",
    createdAt: day(-1),
    updatedAt: day(0),
    messages: [
      {
        id: "m1",
        role: "user",
        content: "Привет! Подскажи, как мне получить доступ к GIS системе?",
        createdAt: day(-1)
      },
      {
        id: "m2",
        role: "assistant",
        content:
          "Здравствуйте! Доступ к GIS оформляется через ServiceDesk: создайте заявку «Доступ к GIS», укажите проект и согласуйте у руководителя. После согласования администратор GIS выдаёт роль в течение 1 рабочего дня.",
        citations: [
          { articleId: "k_access", title: "Как получить доступ к SAP и GIS" }
        ],
        createdAt: day(-1)
      }
    ]
  }
];

const notifications: AppNotification[] = [
  ...users
    .filter((u) => u.role === "employee")
    .map<AppNotification>((u) => ({
      id: `n_welcome_${u.id}`,
      userId: u.id,
      kind: "hr",
      title: "Сообщение от HR-куратора",
      body: "Добро пожаловать в КМГ! Я ваш HR-куратор по адаптации. Если возникнут вопросы — пишите, всегда помогу.",
      createdAt: day(0),
      read: false,
      tone: "navy"
    })),
  {
    id: "n_geo_stage",
    userId: "u_emp_geo",
    kind: "stage",
    title: "Шаг тикета принят",
    body: "Тикет ONB-1042: «Загрузить скан удостоверения» проверен отделом кадров.",
    createdAt: day(0),
    read: false,
    tone: "success",
    href: "/employee/tickets/t_docs_001"
  },
  {
    id: "n_geo_meeting",
    userId: "u_emp_geo",
    kind: "meeting",
    title: "Напоминание о встрече",
    body: "Сегодня в 16:00 — Welcome-кофе с командой подразделения.",
    createdAt: day(0),
    read: false,
    tone: "gold"
  }
];

export function buildInitialState(): PortalState {
  return {
    users,
    tickets: resolvedTickets,
    tasks,
    notifications,
    knowledge,
    activity,
    chats,
    messages: [],
    meetingRequests: [],
    feedback: [
      {
        id: "fb_geo_1",
        userId: "u_emp_geo",
        kind: "pulse",
        mood: "good",
        comment: "Первая неделя понятная, наставник помогает. Хочется больше практики по GIS.",
        pulse: { q1: "В целом понятный", q2: "В целом да", q3: "Обучение" },
        createdAt: day(-1)
      }
    ],
    logins: [
      { id: "lg_geo_1", userId: "u_emp_geo", at: at(-1, 8, 52) },
      { id: "lg_geo_2", userId: "u_emp_geo", at: at(-2, 9, 8) },
      { id: "lg_geo_3", userId: "u_emp_geo", at: at(-3, 11, 4) },
      { id: "lg_eng_1", userId: "u_emp_eng", at: at(-1, 9, 40) }
    ],
    onboarding: {},
    courseProgress: {},
    badges: {},
    vectorDocs: [
      {
        id: "vd_pvtr",
        name: "ПВТР_КМГ_2026.pdf",
        sizeLabel: "1.8 МБ",
        uploadedBy: "Айгерим Сатпаева",
        uploadedAt: day(-12),
        status: "indexed"
      },
      {
        id: "vd_codex",
        name: "Кодекс_деловой_этики.pdf",
        sizeLabel: "0.9 МБ",
        uploadedBy: "Нурлан Жумабаев",
        uploadedAt: day(-5),
        status: "indexed"
      }
    ],
    currentUserId: null,
    hydrated: false
  };
}
