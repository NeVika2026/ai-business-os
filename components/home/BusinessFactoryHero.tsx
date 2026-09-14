'use client';

import styles from './BusinessFactoryHero.module.css';

type BusinessFactoryHeroProps = {
  active?: boolean;
  thinking?: boolean;
};

const sparkPositions = [
  ['12%', '24%', '2px', '-1.1s'],
  ['19%', '67%', '3px', '-2.4s'],
  ['27%', '38%', '2px', '-3.8s'],
  ['34%', '76%', '2px', '-1.7s'],
  ['43%', '18%', '3px', '-4.9s'],
  ['51%', '59%', '2px', '-2.8s'],
  ['61%', '30%', '2px', '-4.4s'],
  ['68%', '73%', '3px', '-2s'],
  ['77%', '16%', '2px', '-5.3s'],
  ['84%', '49%', '3px', '-3.2s'],
  ['91%', '27%', '2px', '-4.1s'],
] as const;

export function BusinessFactoryHero({ active = false, thinking = false }: BusinessFactoryHeroProps) {
  const stateLabel = thinking ? 'Собираю решение' : active ? 'Задача принята' : 'AI Core готов';

  return (
    <section
      className={[styles.shell, active ? styles.active : '', thinking ? styles.thinking : '']
        .filter(Boolean)
        .join(' ')}
      aria-label="3D-ядро Бизнес-Завода"
    >
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.sparks} aria-hidden="true">
        {sparkPositions.map(([left, top, size, delay], index) => (
          <i
            key={index}
            style={{
              left,
              top,
              width: size,
              height: size,
              animationDelay: delay,
            }}
          />
        ))}
      </div>

      <div className={styles.header}>
        <div>
          <small>БИЗНЕС-ЗАВОД · AI OPERATING SYSTEM</small>
          <strong>AI Core</strong>
        </div>
        <span className={styles.live}><i /> {stateLabel}</span>
      </div>

      <div className={styles.scene}>
        <div className={styles.orbit + ' ' + styles.orbitA} aria-hidden="true" />
        <div className={styles.orbit + ' ' + styles.orbitB} aria-hidden="true" />
        <div className={styles.orbit + ' ' + styles.orbitC} aria-hidden="true" />

        <div className={styles.cubeScene}>
          <div className={styles.cube}>
            <div className={styles.face + ' ' + styles.front}><b>AI</b><small>CORE</small></div>
            <div className={styles.face + ' ' + styles.back}><b>RESULT</b><small>READY</small></div>
            <div className={styles.face + ' ' + styles.right}><b>TOOLS</b><small>LIVE</small></div>
            <div className={styles.face + ' ' + styles.left}><b>TEAM</b><small>AGENTS</small></div>
            <div className={styles.face + ' ' + styles.top}><b>IDEA</b><small>INPUT</small></div>
            <div className={styles.face + ' ' + styles.bottom}><b>BUILD</b><small>OUTPUT</small></div>
          </div>
        </div>

        <div className={styles.platform} aria-hidden="true">
          <span />
          <span />
          <b />
        </div>

        <div className={styles.badge + ' ' + styles.badgeOne}>
          <b>01</b><span>Задача</span>
        </div>
        <div className={styles.badge + ' ' + styles.badgeTwo}>
          <b>02</b><span>Команда</span>
        </div>
        <div className={styles.badge + ' ' + styles.badgeThree}>
          <b>03</b><span>Результат</span>
        </div>
      </div>

      <div className={styles.footer}>
        <span>Задача</span><i>→</i><span>AI-команда</span><i>→</i><span>Инструменты</span><i>→</i><span>Результат</span>
      </div>
    </section>
  );
}
