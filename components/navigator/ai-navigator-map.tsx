'use client';

import './ai-navigator-map.css';

type NavigatorNode = {
  id: string;
  label: string;
  meta: string;
  status: 'active' | 'attention' | 'ready';
  x: number;
  y: number;
};

const nodes: NavigatorNode[] = [
  { id: 'marketing', label: 'Маркетинг', meta: '12 кампаний', status: 'active', x: 50, y: 8 },
  { id: 'crm', label: 'CRM', meta: '128 клиентов', status: 'ready', x: 18, y: 28 },
  { id: 'documents', label: 'Документы', meta: '5 на проверке', status: 'attention', x: 82, y: 28 },
  { id: 'sales', label: 'Продажи', meta: '+18% за месяц', status: 'active', x: 10, y: 58 },
  { id: 'automation', label: 'Автоматизация', meta: '42 процесса', status: 'active', x: 90, y: 58 },
  { id: 'education', label: 'Обучение', meta: '71% прогресса', status: 'ready', x: 24, y: 86 },
  { id: 'marketplace', label: 'Marketplace', meta: '548 сервисов', status: 'ready', x: 76, y: 86 },
];

export function AiNavigatorMap() {
  return (
    <section className="navigator-shell glass-panel" aria-labelledby="navigator-title">
      <header className="navigator-header">
        <div>
          <span className="navigator-eyebrow">AI Navigator 2.0</span>
          <h2 id="navigator-title">Карта Бизнес-Завода</h2>
          <p>Живая схема модулей, статусов и точек внимания.</p>
        </div>
        <button className="liquid-button" type="button">Открыть навигатор</button>
      </header>

      <div className="navigator-canvas">
        <div className="navigator-orbit navigator-orbit-one" />
        <div className="navigator-orbit navigator-orbit-two" />

        <div className="navigator-core" tabIndex={0}>
          <span className="status-dot" />
          <strong>AI Core</strong>
          <small>Система активна</small>
          <b>98%</b>
        </div>

        {nodes.map((node) => (
          <button
            className={`navigator-node navigator-node-${node.status}`}
            key={node.id}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            type="button"
          >
            <span>{node.label}</span>
            <small>{node.meta}</small>
          </button>
        ))}
      </div>

      <footer className="navigator-legend">
        <span><i className="legend-active" /> Работает</span>
        <span><i className="legend-ready" /> Готово</span>
        <span><i className="legend-attention" /> Требует внимания</span>
      </footer>
    </section>
  );
}
