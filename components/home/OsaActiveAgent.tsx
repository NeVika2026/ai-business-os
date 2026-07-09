'use client';

import type { HomeOrchestraSnapshot } from '@/app/(dashboard)/home/actions';
import { OSA_VOICE } from '@/utils/first-experience/osa-voice';

type OsaActiveAgentProps = {
  orchestra: HomeOrchestraSnapshot;
};

export function OsaActiveAgent({ orchestra }: OsaActiveAgentProps) {
  const label = orchestra.activeAgentRole ?? orchestra.activeAgentName;

  return (
    <section className="osa-active-agent" aria-live="polite" aria-label="Текущий этап работы">
      <p className="osa-active-agent-headline">{OSA_VOICE.realWork.workingHeadline}</p>

      {label ? (
        <div className="osa-active-agent-card">
          <div className="osa-active-agent-meta">
            <span className="osa-active-agent-pulse" aria-hidden="true" />
            <p className="osa-active-agent-role">{label}</p>
          </div>
          {orchestra.activeActivity ? (
            <p className="osa-active-agent-activity">{orchestra.activeActivity}</p>
          ) : null}
          <div className="osa-active-agent-progress">
            <div
              className="osa-active-agent-progress-bar"
              style={{ width: `${orchestra.overallProgress}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="osa-active-agent-activity">Собираю финальный результат…</p>
      )}
    </section>
  );
}
