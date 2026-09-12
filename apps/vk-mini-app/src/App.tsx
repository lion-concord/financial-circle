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
import "./styles.css";

type Tab = "home" | "club" | "referrals" | "profile";

type AppState = {
  balance: number;
  hold: number;
  referrals: number;
  subscription: string | null;
  payouts: number[];
};

const INITIAL_STATE: AppState = {
  balance: 24500,
  hold: 8700,
  referrals: 12,
  subscription: "Премиум",
  payouts: [],
};

const TARIFFS = [
  {
    name: "Старт",
    price: 990,
    description: "Для знакомства с возможностями клуба",
    accent: "blue",
  },
  {
    name: "Премиум",
    price: 2990,
    description: "Максимум преимуществ и повышенный кешбэк",
    accent: "gold",
  },
  {
    name: "Партнёр",
    price: 7990,
    description: "Для активного развития реферальной сети",
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

  useEffect(() => {
    localStorage.setItem("financial-circle-state", JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

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
    const link = "https://vk.com/app_financial_circle?ref=fc_demo_2481";

    try {
      await navigator.clipboard.writeText(link);
      setNotice("Реферальная ссылка скопирована");
    } catch {
      setNotice(link);
    }
  }

  function requestPayout() {
    if (state.balance < 1000) {
      setNotice("Минимальная сумма выплаты — 1 000 ₽");
      return;
    }

    setState((current) => ({
      ...current,
      payouts: [...current.payouts, current.balance],
      balance: 0,
    }));
    setNotice("Заявка на выплату создана");
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
                        onPayout={requestPayout}
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
                        subscription={state.subscription}
                        payouts={state.payouts}
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
  onPayout,
  onOpenClub,
}: {
  state: AppState;
  total: number;
  onPayout: () => void;
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
          <button className="action-card action-primary" onClick={onPayout}>
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
          <span className="muted">Все</span>
        </div>
        <div className="operation-list">
          <Operation icon="◈" title="Партнёрское начисление" date="Сегодня, 12:40" amount="+1 250 ₽" />
          <Operation icon="✦" title="Кешбэк клуба" date="Вчера, 18:15" amount="+480 ₽" />
          <Operation icon="◷" title="Начисление в холд" date="12 сентября" amount="+2 100 ₽" pending />
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
            {tariff.name === "Премиум" && <div className="popular">ПОПУЛЯРНЫЙ</div>}
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
        <div className="section-heading"><h2>Ваша ссылка</h2></div>
        <div className="referral-box">
          <span>vk.com/app_financial_circle…</span>
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
  subscription,
  payouts,
  onReset,
}: {
  subscription: string | null;
  payouts: number[];
  onReset: () => void;
}) {
  return (
    <>
      <PageTitle title="Профиль" subtitle="Ваш аккаунт в Финансовом Круге" />
      <section className="profile-card">
        <div className="avatar">АИ</div>
        <div><h2>Алексей Иванов</h2><p>VK ID · 24812481</p></div>
      </section>
      <div className="profile-row"><span>Тариф</span><b>{subscription ?? "Не подключён"}</b></div>
      <div className="profile-row"><span>Заявок на выплату</span><b>{payouts.length}</b></div>
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
