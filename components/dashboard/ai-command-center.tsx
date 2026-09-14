'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

const workshops = [
  { n: '01', title: 'Оркестратор', text: 'Собирает команду AI под цель', href: '/orchestrator', icon: '✦' },
  { n: '02', title: 'AI-сотрудники', text: 'Специалисты для конкретных задач', href: '/ai-employees', icon: '◉' },
  { n: '03', title: 'CRM', text: 'Клиенты, сделки и следующий шаг', href: '/crm', icon: '⌁' },
  { n: '04', title: 'База знаний', text: 'Документы и контекст бизнеса', href: '/knowledge', icon: '◇' },
  { n: '05', title: 'Marketplace', text: 'Инструменты и интеграции', href: '/marketplace', icon: '⬡' },
  { n: '06', title: 'Академия', text: 'Навыки и рабочие сценарии', href: '/academy', icon: '△' },
] as const;

const sparks = [
  ['11%','22%','2px','-1.2s'],['18%','68%','3px','-2.7s'],['24%','36%','2px','-4.1s'],['31%','78%','2px','-1.8s'],
  ['39%','18%','3px','-5.2s'],['45%','61%','2px','-3.1s'],['52%','29%','2px','-4.8s'],['58%','74%','3px','-2.2s'],
  ['63%','13%','2px','-5.8s'],['69%','56%','2px','-1.4s'],['74%','31%','3px','-3.8s'],['79%','69%','2px','-4.5s'],
  ['83%','19%','2px','-2.9s'],['88%','46%','3px','-5.4s'],['91%','74%','2px','-1.7s'],['95%','28%','2px','-3.5s'],
] as const;

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

export function AiCommandCenter() {
  const router = useRouter();
  const [task, setTask] = useState('');

  function launch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = task.trim();
    router.push(value ? `/orchestrator?task=${encodeURIComponent(value)}` : '/orchestrator');
  }

  return (
    <main className="factory-home">
      <div className="factory-noise" aria-hidden="true" />
      <div className="factory-grid-bg" aria-hidden="true" />
      <div className="factory-sparks" aria-hidden="true">
        {sparks.map(([left, top, size, delay], index) => (
          <i
            key={index}
            style={{ '--spark-left': left, '--spark-top': top, '--spark-size': size, '--spark-delay': delay } as React.CSSProperties}
          />
        ))}
      </div>

      <section className="factory-hero">
        <div className="factory-hero-copy">
          <div className="factory-kicker"><i /> БИЗНЕС-ЗАВОД · AI OPERATING SYSTEM</div>
          <h1>
            Скажите, что нужно.
            <span>Завод соберёт решение.</span>
          </h1>
          <p>
            Не выбирайте нейросеть, агента или сервис вручную. Опишите цель обычными словами —
            оркестратор подключит нужных AI-сотрудников, инструменты и бизнес-контекст.
          </p>

          <form className="factory-launcher" onSubmit={launch}>
            <span className="factory-launcher-mark">✦</span>
            <input
              value={task}
              onChange={(event) => setTask(event.target.value)}
              placeholder="Например: запусти рекламу, сделай ролик и собери воронку"
              aria-label="Задача для Бизнес-Завода"
            />
            <button type="submit">Запустить завод <b>→</b></button>
          </form>

          <div className="factory-live-row">
            <span><i />AI Core онлайн</span>
            <span>Оркестратор</span>
            <span>AI-сотрудники</span>
            <span>Инструменты</span>
          </div>
        </div>

        <div className="factory-machine" aria-label="3D ядро Бизнес-Завода">
          <div className="factory-energy" />
          <div className="factory-orbit factory-orbit-a" />
          <div className="factory-orbit factory-orbit-b" />
          <div className="factory-orbit factory-orbit-c" />

          <div className="factory-cube-scene">
            <div className="factory-cube">
              <div className="cube-face cube-front"><b>AI</b><small>CORE</small></div>
              <div className="cube-face cube-back"><b>RESULT</b><small>READY</small></div>
              <div className="cube-face cube-right"><b>TOOLS</b><small>548+</small></div>
              <div className="cube-face cube-left"><b>AGENTS</b><small>TEAM</small></div>
              <div className="cube-face cube-top"><b>IDEA</b><small>INPUT</small></div>
              <div className="cube-face cube-bottom"><b>BUILD</b><small>OUTPUT</small></div>
            </div>
          </div>

          <div className="factory-platform">
            <span className="platform-ring platform-ring-a" />
            <span className="platform-ring platform-ring-b" />
            <span className="platform-core" />
          </div>

          <div className="factory-badge factory-badge-one"><b>18</b><span>AI-сотрудников</span></div>
          <div className="factory-badge factory-badge-two"><b>42</b><span>сценария</span></div>
          <div className="factory-badge factory-badge-three"><b>98%</b><span>готовность</span></div>
        </div>
      </section>

      <section className="factory-flow" aria-label="Как работает Бизнес-Завод">
        <div><small>01</small><b>Задача</b><span>Пишете цель как есть</span></div>
        <i>→</i>
        <div><small>02</small><b>Сборка</b><span>AI выбирает команду и навыки</span></div>
        <i>→</i>
        <div><small>03</small><b>Производство</b><span>Инструменты выполняют работу</span></div>
        <i>→</i>
        <div><small>04</small><b>Результат</b><span>Получаете готовый следующий шаг</span></div>
      </section>

      <section className="factory-workshops">
        <header>
          <div>
            <p>ЦЕХА БИЗНЕС-ЗАВОДА</p>
            <h2>Всё внутри одной системы</h2>
          </div>
          <Link href="/orchestrator" className="factory-text-link">Открыть Mission Control <Arrow /></Link>
        </header>

        <div className="factory-workshop-grid">
          {workshops.map((item) => (
            <Link href={item.href} className="factory-workshop-card" key={item.title}>
              <div className="factory-card-top">
                <span className="factory-workshop-icon">{item.icon}</span>
                <small>{item.n}</small>
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <Arrow />
            </Link>
          ))}
        </div>
      </section>

      <section className="factory-status-panel">
        <div>
          <p>AI NAVIGATOR 2.0</p>
          <h2>Система не ждёт команды. Она ищет, что можно улучшить.</h2>
        </div>
        <div className="factory-status-metrics">
          <span><b>548</b><small>инструментов</small></span>
          <span><b>18</b><small>AI-сотрудников</small></span>
          <span><b>42</b><small>автоматизации</small></span>
          <span><b>7</b><small>проектов</small></span>
        </div>
      </section>
    </main>
  );
}
