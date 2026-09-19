import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  BUSINESS_ZAVOD_MODULES,
  BUSINESS_ZAVOD_NAVIGATION,
  BUSINESS_ZAVOD_TASKS,
  getPlatformModule,
  getPlatformTasks,
} from '@/utils/platform/business-zavod-config';

describe('Business Zavod platform configuration', () => {
  it('uses the required Russian navigation order', () => {
    assert.deepEqual(
      BUSINESS_ZAVOD_NAVIGATION.map((item) => item.label),
      [
        'Главная',
        'Создать',
        'Продать',
        'Продвинуть',
        'Опубликовать',
        'Найти',
        'Проанализировать',
        'Автоматизировать',
        'Голосовой агент',
        'Связаться',
        'Проекты',
        'CRM',
        'Входящие',
        'Аналитика CRM',
        'Импорт CRM',
        'Дубли CRM',
        'Trend Lab',
        'Медиа',
        'Файлы',
        'Интеграции',
      ],
    );
  });

  it('gives every work module at least one actionable task', () => {
    const workModules = BUSINESS_ZAVOD_MODULES.filter((item) => item.kind === 'work');

    for (const platformModule of workModules) {
      assert.ok(
        getPlatformTasks(platformModule.id).length > 0,
        `missing tasks for ${platformModule.id}`,
      );
      assert.equal(getPlatformModule(platformModule.id)?.id, platformModule.id);
    }
  });

  it('routes module navigation to real module pages', () => {
    for (const platformModule of BUSINESS_ZAVOD_MODULES.filter(
      (item) => item.kind === 'work',
    )) {
      const nav = BUSINESS_ZAVOD_NAVIGATION.find(
        (item) => item.moduleId === platformModule.id,
      );
      assert.equal(nav?.href, `/modules/${platformModule.id}`);
    }
  });

  it('links the full marketing pack to its guided builder', () => {
    const task = getPlatformTasks('promote').find((item) => item.id === 'marketing-pack');
    assert.equal(task?.href, '/modules/promote/marketing-pack');
  });

  it('keeps provider names out of primary labels and task copy', () => {
    const visibleCopy = JSON.stringify({
      navigation: BUSINESS_ZAVOD_NAVIGATION,
      tasks: BUSINESS_ZAVOD_TASKS,
    });
    assert.doesNotMatch(visibleCopy, /OpenAI|Runway|ElevenLabs|Claude|Gemini|Kling|Sora/i);
  });
});
