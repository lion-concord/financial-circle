import { useEffect, useMemo, useState } from "react";
import {
  AdaptivityProvider,
  AppRoot,
  ConfigProvider,
  Panel,
  PanelHeader,
  SplitCol,
  SplitLayout,
  View,
} from "@vkontakte/vkui";
import vkBridge from "@vkontakte/vk-bridge";
import "./styles.css";

type Tab = "home" | "club" | "referrals" | "profile";

type OperationItem = {
  id: string;
  icon: string;
  title: string;
  date: string;
  amount: string;
  pending?: boolean;
};

type AppState = {
  balance: number;
  hold: number;
  referrals: number;
  subscription: string | null;
  operations: OperationItem[];
};

const INITIAL_STATE: AppState = {
  balance: 24500,
  hold: 8700,
  referrals: 12,
  subscription: "Инвестор",
  operations: [
    { id: "1", icon: "◈", title: "Партнёрское начисление", date: "Сегодня, 12:40", amount: "+1 250 ₽" },
    { id: "2", icon: "✦", title: "Кешбэк клуба", date: "Вчера, 18:15", amount="+480 ₽" },
    { id: "3", icon: "◷", title: "Начисление в холд", date: "12 сентября", amount="+2 100 ₽", pending: true },
  ],
};

const TARIFFS = [
  {
    name: "Старт",
    price: 990,
    description: "Для знакомства с возможностями клуба",
    accent: "blue",
  },
  {
    name: "Инвестор",
    price: 2500,
    description: "Расширенные возможности и повышенный кешбэк",
    accent: "gold",
  },
  {
    name: "Инвестор Про",
    price: 4900,
    description: "Максимум возможностей и развитие партнёрской сети",
    accent: "purple",
  },
];

function formatMoney(value: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

function readState(): AppState {
  try {
    const saved = localStorage.getItem("financial-circle-state");
    return saved ? { ...INITIAL_STATE, ...JSON.parse(saved) } : INITIAL_STATE;
  } catch {
    return INITIAL_STATE;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [state, setState] = useState<AppState>(readState);
  const [notice, setNotice] = useState("");
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [vkUser, setVkUser] = useState<{ name: string; photo?: string; id?: number } | null>(null);

  useEffect(() => {
    localStorage.setItem("financial-circle-state", JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    vkBridge.send("VKWebAppInit").catch(() => {});
    vkBridge
      .send("VKWebAppGetUserInfo")
      .then((data) => {
        if (data && data.first_name) {
          setVkUser({
            name: `${data.first_name} ${data.last_name || ""}`.trim(),
            photo: data.photo_200,
            id: data.id,
          });
        }
      })
      .catch(() => {
        // Если не в ВК, останется дефолтный профиль
      });
  }, []);

  const total = useMemo(() => state.balance + state.hold, [state]);

  function chooseTariff(name: string, price: number) {
    setState((current) => ({
      ...current,
      subscription: name,
      balance: Math.max(0, current.balance - price),
    }));
    setNotice(`Тариф «${name}» подключён`);
  }

  async function copyReferral() {
    const appId = "53123456"; // Замените при необходимости на реальный ID приложения из ВК
    const userId = vkUser?.id || "2481";
    const link = `https://vk.com/app${appId}?ref=fc_${userId}`;

    try {
      await navigator.clipboard.writeText(link);
      setNotice("Реферальная ссылка скопирована");
    } catch {
      setNotice(link);
    }
  }

  function submitPayout(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(payoutAmount);

    if (isNaN(amount) || amount <= 0) {
      setNotice("Введите корректную сумму");
      return;
    }
    if (amount < 1000) {
      setNotice("Минимальная сумма выплаты — 1 000 ₽");
      return;
    }
    if (amount > state.balance) {
    setNotice("Сумма превышает доступный баланс");
      return;
    }

    const newOp: OperationItem = {
      id: Date.now().toString(),
      icon: "↗",
      title: "Заявка на выплату",
      date: "Только что",
      amount: `-${amount.toLocaleString("ru-RU")} ₽`,
      pending: true,
    };

    setState((current) => ({
      ...current,
      balance: current.balance - amount,
      operations: [newOp, ...current.operations],
    }));

    setPayoutAmount("");
    setIsPayoutModalOpen(false);
    setNotice("Заявка на выплату создана успешно");
  }

  return (
    <ConfigProvider>
      <AdaptivityProvider>
        <AppRoot className="app-root">
          <SplitLayout>
            <SplitCol>
              <View activePanel="main">
                <Panel id="main">
                  <PanelHeader className="top-header">
                    <div className="brand">
                      <span className="brand-mark">ФК</span>
                      <span>Финансовый Круг</span>
                    </div>
                  </PanelHeader>

                  <main className="app-content">
                    {notice && <div className="toast">{notice}</div>}

                    {activeTab === "home" && (
                      <HomeScreen
                        state={state}
                        total={total}
                        onOpenPayout={() => setIsPayoutModalOpen(true)}
                        onOpenClub={() => setActiveTab("club")}
                      />
                    )}

                    {activeTab === "club" && (
                      <ClubScreen
                        current={state.subscription}
                        onChoose={chooseTariff}
                      />
                    )}

                    {activeTab === "referrals" && (
                      <ReferralsScreen
                        count={state.referrals}
                        onCopy={copyReferral}
                      />
                    )}

                    {activeTab === "profile" && (
                      <ProfileScreen
                        user={vkUser}
                        subscription={state.subscription}
                        operationsCount={state.operations.length}
                        onReset={() => {
                          setState(INITIAL_STATE);
                          setNotice("Локальные данные сброшены");
                        }}
                      />
                    )}
                  </main>

                  <nav className="bottom-nav" aria-label="Основная навигация">
                    <NavButton
                      active={activeTab === "home"}
                      icon="⌂"
                      label="Главная"
                      onClick={() => setActiveTab("home")}
                    />
                    <NavButton
                      active={activeTab === "club"}
                      icon="✦"
                      label="Клуб"
                      onClick={() => setActiveTab("club")}
                    />
                    <NavButton
                      active={activeTab === "referrals"}
                      icon="♧"
                      label="Партнёры"
                      onClick={() => setActiveTab("referrals")}
                    />
                    <NavButton
                      active={activeTab === "profile"}
                      icon="◉"
                      label="Профиль"
                      onClick={() => setActiveTab("profile")}
                    />
                  </nav>

                  {isPayoutModalOpen && (
                    <div className="modal-backdrop">
                      <div className="modal-card">
                        <h3>Запрос выплаты</h3>
                        <p>Доступно: {formatMoney(state.balance)} (мин. 1 000 ₽)</p>
                        <form onSubmit={submitPayout}>
                          <input
                            type="number"
                            className="modal-input"
                            placeholder="Сумма в рублях"
                            value={payoutAmount}
                            onChange={(e) => setPayoutAmount(e.target.value)}
                            autoFocus
                            min="1000"
                            max={state.balance}
                          />
                          <div className="modal-buttons">
                            <button
                              type="button"
                              className="outline-button"
                              onClick={() => setIsPayoutModalOpen(false)}
                            >
                              Отмена
                            </button>
                            <button type="submit" className="gold-button">
                              Создать заявку
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </Panel>
              </View>
            </SplitCol>
          </SplitLayout>
        </AppRoot>
      </AdaptivityProvider>
    </ConfigProvider>
  );
}

function HomeScreen({
  state,
  total,
  onOpenPayout,
  onOpenClub,
}: {
  state: AppState;
  total: number;
  onOpenPayout: () => void;
  onOpenClub: () => void;
}) {
  return (
    <>
      <section className="hero">
        <div className="eyebrow">ВАШ ФИНАНСОВЫЙ КРУГ</div>
        <h1>Деньги работают<br />на ваши цели</h1>
        <p>Управляйте доходами, подпиской и партнёрскими начислениями в одном месте.</p>
      </section>

      <section className="balance-card">
        <div className="card-glow" />
        <div className="balance-label">ОБЩИЙ БАЛАНС</div>
        <div className="balance-value">{formatMoney(total)}</div>
        <div className="balance-footer">
          <span>Обновлено только что</span>
          <span className="status-dot">● В сети</span>
        </div>
      </section>

      <div className="metrics-grid">
        <Metric label="Доступно" value={formatMoney(state.balance)} icon="↗" />
        <Metric label="В холде" value={formatMoney(state.hold)} icon="◷" />
      </div>

      <section className="section">
        <div className="section-heading">
          <h2>Быстрые действия</h2>
        </div>
        <div className="actions-grid">
          <button className="action-card action-primary" onClick={onOpenPayout}>
            <span className="action-icon">↗</span>
            <b>Вывести</b>
            <small>На карту или счёт</small>
          </button>
          <button className="action-card" onClick={onOpenClub}>
            <span className="action-icon">✦</span>
            <b>Улучшить тариф</b>
            <small>Больше возможностей</small>
          </button>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Последние операции</h2>
          <span className="muted">{state.operations.length} всего</span>
        </div>
        <div className="operation-list">
          {state.operations.map((op) => (
            <Operation
              key={op.id}
              icon={op.icon}
              title={op.title}
              date={op.date}
              amount={op.amount}
              pending={op.pending}
            />
          ))}
        </div>
      </section>
    </>
  );
}

function ClubScreen({
  current,
  onChoose,
}: {
  current: string | null;
  onChoose: (name: string, price: number) => void;
}) {
  return (
    <>
      <PageTitle title="Клуб" subtitle="Выберите уровень участия" />
      <div className="current-plan">
        <span className="plan-star">✦</span>
        <div>
          <small>ТЕКУЩИЙ ТАРИФ</small>
          <strong>{current ?? "Не подключён"}</strong>
        </div>
        <span className="active-badge">АКТИВЕН</span>
      </div>
      <div className="tariff-list">
        {TARIFFS.map((tariff) => (
          <article className={`tariff-card ${tariff.accent}`} key={tariff.name}>
            {tariff.name === "Инвестор" && <div className="popular">ПОПУЛЯРНЫЙ</div>}
            <div className="tariff-top">
              <span className="tariff-icon">✦</span>
              <h3>{tariff.name}</h3>
            </div>
            <div className="tariff-price">{formatMoney(tariff.price)} <small>/ месяц</small></div>
            <p>{tariff.description}</p>
            <button className="gold-button" onClick={() => onChoose(tariff.name, tariff.price)}>
              {current === tariff.name ? "Текущий тариф" : "Подключить"}
            </button>
          </article>
        ))}
      </div>
    </>
  );
}

function ReferralsScreen({
  count,
  onCopy,
}: {
  count: number;
  onCopy: () => void;
}) {
  return (
    <>
      <PageTitle title="Партнёры" subtitle="Растите вместе с вашим кругом" />
      <section className="referral-hero">
        <div className="referral-number">{count}</div>
        <div>
          <b>активных партнёров</b>
          <p>Ваш круг продолжает расти</p>
        </div>
      </section>
      <section className="section">
        <div className="section-heading"><h2>Ваша реферальная ссылка</h2></div>
        <div className="referral-box">
          <span>Нажмите кнопку справа для копирования</span>
          <button onClick={onCopy}>Копировать</button>
        </div>
      </section>
      <div className="metrics-grid">
        <Metric label="За месяц" value="+8 450 ₽" icon="↗" />
        <Metric label="Всего начислено" value="52 800 ₽" icon="◈" />
      </div>
      <section className="info-note">
        <span>✦</span>
        <p><b>Приглашайте друзей</b><br />Получайте вознаграждение за активность участников вашего круга.</p>
      </section>
    </>
  );
}

function ProfileScreen({
  user,
  subscription,
  operationsCount,
  onReset,
}: {
  user: { name: string; photo?: string; id?: number } | null;
  subscription: string | null;
  operationsCount: number;
  onReset: () => void;
}) {
  const displayName = user?.name || "Алексей Иванов";
  const displayId = user?.id ? `VK ID · ${user.id}` : "VK ID · 24812481";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <PageTitle title="Профиль" subtitle="Ваш аккаунт в Финансовом Круге" />
      <section className="profile-card">
        {user?.photo ? (
          <img src={user.photo} alt="Avatar" className="avatar-img" />
        ) : (
          <div className="avatar">{initials}</div>
        )}
        <div>
          <h2>{displayName}</h2>
          <p>{displayId}</p>
        </div>
      </section>
      <div className="profile-row"><span>Тариф</span><b>{subscription ?? "Не подключён"}</b></div>
      <div className="profile-row"><span>Всего операций</span><b>{operationsCount}</b></div>
      <button className="outline-button" onClick={onReset}>Сбросить локальные данные</button>
      <p className="disclaimer">Демонстрационный режим. Данные сохранены только на этом устройстве.</p>
    </>
  );
}

function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return <header className="page-title"><div className="eyebrow">ФИНАНСОВЫЙ КРУГ</div><h1>{title}</h1><p>{subtitle}</p></header>;
}

function Metric({ label, value, icon }: { label: string; value: string; icon: string }) {
  return <div className="metric"><span className="metric-icon">{icon}</span><small>{label}</small><strong>{value}</strong></div>;
}

function Operation({
  icon,
  title,
  date,
  amount,
  pending = false,
}: {
  icon: string;
  title: string;
  date: string;
  amount: string;
  pending?: boolean;
}) {
  return <div className="operation"><span className="operation-icon">{icon}</span><div><b>{title}</b><small>{date}</small></div><strong className={pending ? "pending" : ""}>{amount}</strong></div>;
}

function NavButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return <button className={`nav-button ${active ? "active" : ""}`} onClick={onClick}><span>{icon}</span><small>{label}</small></button>;
}
