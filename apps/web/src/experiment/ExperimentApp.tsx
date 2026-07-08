import {
  BarChart3,
  ClipboardList,
  Files,
  FlaskConical,
  LayoutDashboard,
  Smartphone
} from "lucide-react";
import "./experiment.css";

const focusAreas = [
  {
    icon: ClipboardList,
    title: "Онлайн-опрос",
    text: "Проверить более понятный сценарий прохождения анкеты без копирования бумажной формы один в один."
  },
  {
    icon: Smartphone,
    title: "Мобильный ввод",
    text: "Спроектировать быстрый ввод анкет с телефона как самостоятельный рабочий сценарий."
  },
  {
    icon: BarChart3,
    title: "Работа с данными",
    text: "Найти удобный способ смотреть строки, фильтры, PDF-архив и визуализации без перегруза."
  }
];

const principles = [
  "не копировать интерфейс основной версии",
  "проверять идеи на маленьких законченных сценариях",
  "проектировать сначала под телефон, потом под ноутбук",
  "не использовать реальные данные для сомнительных экспериментов"
];

export function ExperimentApp() {
  return (
    <main className="experiment-page">
      <section className="experiment-hero">
        <div className="experiment-kicker">
          <FlaskConical aria-hidden size={18} />
          test.snz-rodoved.ru
        </div>
        <h1>Родовед Lab</h1>
        <p>
          Отдельный экспериментальный сайт для переосмысления опросов, ввода анкет и работы с
          результатами.
        </p>
        <div className="experiment-actions">
          <a href="https://snz-rodoved.ru/">Открыть стабильный сайт</a>
          <span>Чистый старт</span>
        </div>
      </section>

      <section className="experiment-section">
        <div>
          <p className="experiment-eyebrow">Зачем этот домен</p>
          <h2>Здесь не staging, а лаборатория продукта.</h2>
        </div>
        <p>
          Основная версия остаётся стабильной рабочей системой. Этот сабдомен нужен для других
          интерфейсных решений, новых способов прохождения онлайн-опроса и проверки рабочих
          сценариев до того, как они попадут в основной продукт.
        </p>
      </section>

      <section className="experiment-grid" aria-label="Направления экспериментов">
        {focusAreas.map((area) => {
          const Icon = area.icon;
          return (
            <article key={area.title}>
              <Icon aria-hidden size={28} />
              <h2>{area.title}</h2>
              <p>{area.text}</p>
            </article>
          );
        })}
      </section>

      <section className="experiment-workbench">
        <div>
          <p className="experiment-eyebrow">Следующий слой</p>
          <h2>Будущая структура</h2>
        </div>
        <div className="experiment-map">
          <div>
            <LayoutDashboard aria-hidden size={22} />
            <span>Новая рабочая зона</span>
          </div>
          <div>
            <ClipboardList aria-hidden size={22} />
            <span>Новый опрос</span>
          </div>
          <div>
            <Files aria-hidden size={22} />
            <span>PDF и данные</span>
          </div>
        </div>
      </section>

      <section className="experiment-rules">
        <p className="experiment-eyebrow">Правила test-домена</p>
        <ul>
          {principles.map((principle) => (
            <li key={principle}>{principle}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
