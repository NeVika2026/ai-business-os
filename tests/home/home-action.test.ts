import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildHomeTaskPrompt,
  HOME_PROCESS_STEPS,
  HOME_QUICK_ACTIONS,
  homeTaskErrorHint,
} from '@/utils/home/home-action';

describe('home action helpers', () => {
  it('builds prompts for quick actions', () => {
    assert.equal(buildHomeTaskPrompt('', 'analysis'), 'Помоги разобраться');
    assert.equal(buildHomeTaskPrompt('Landing Page', 'debug'), 'Найди слабое место: Landing Page');
    assert.equal(buildHomeTaskPrompt('Q2 launch', 'plan'), 'Наметь план: Q2 launch');
    assert.equal(buildHomeTaskPrompt('Custom task'), 'Custom task');
  });

  it('defines the visible OSA process steps', () => {
    assert.equal(HOME_PROCESS_STEPS.length, 4);
    assert.match(HOME_PROCESS_STEPS[0] ?? '', /Слушаю/);
    assert.match(HOME_PROCESS_STEPS[3] ?? '', /первый ответ/);
  });

  it('exposes three quick actions', () => {
    assert.equal(HOME_QUICK_ACTIONS.length, 3);
    assert.deepEqual(
      HOME_QUICK_ACTIONS.map((action) => action.label),
      ['Разобраться', 'Найти слабое место', 'Наметить план'],
    );
  });

  it('returns actionable error hints', () => {
    assert.match(homeTaskErrorHint('Требуется авторизация.'), /Войдите снова/);
    assert.match(homeTaskErrorHint('OSA не смогла связаться с AI.'), /соединение/i);
    assert.match(homeTaskErrorHint('Что-то пошло не так.'), /короче сформулировать/);
  });
});
