'use client';

import { useState } from 'react';

type ToolId = 'post' | 'offer' | 'plan';

const options: { id: ToolId; label: string; explanation: string }[] = [
  {
    id: 'post',
    label: 'Пост для соцсетей',
    explanation: 'Публикация с заголовком, пользой и действием',
  },
  {
    id: 'offer',
    label: 'Сообщение клиенту',
    explanation: 'Первое касание без выдуманных скидок и обещаний',
  },
  {
    id: 'plan',
    label: 'Контент-план на неделю',
    explanation: 'Семь тем для полезного контента в вашей нише',
  },
];

export function buildFreeResult(kind: ToolId, subject: string, audience: string): string {
  const topic = subject.trim().slice(0, 180);
  const readers = audience.trim().slice(0, 160);
  if (!topic || !readers) return '';

  if (kind === 'post') {
    return `ЗАГОЛОВОК: Что стоит знать о ${topic} до принятия решения?

Если вы — ${readers}, наверняка важно понять, что действительно подходит под ваши задачи, а за что нет смысла переплачивать.

Начните с трёх вопросов:
1. Какую конкретную задачу должно решить ${topic}?
2. Какие условия, расходы или ограничения нужно проверить заранее?
3. По каким признакам вы поймёте, что получили нужный результат?

Сравнивайте варианты по фактам. Не обещайте себе результата, пока не проверены условия.

Расскажите в комментариях, что вас больше всего интересует в теме «${topic}».

#Полезное #Разбор`;
  }

  if (kind === 'offer') {
    return `Здравствуйте! Вижу, что для вас может быть актуальна тема «${topic}».

Я работаю с этим направлением и могу помочь разобраться, какие решения подходят для ${readers}, какие вопросы нужно уточнить и на что обратить внимание при выборе.

Если тема интересна, напишите, какая задача у вас сейчас стоит. Я предложу следующий конкретный шаг без обязательств и громких обещаний.`;
  }

  return `КОНТЕНТ-ПЛАН НА 7 ДНЕЙ
Тема: ${topic}
Аудитория: ${readers}

Понедельник — 3 типичных вопроса аудитории по теме «${topic}». Формат: короткий пост.
Вторник — 1 ошибка при выборе решения и как её избежать. Формат: видео.
Среда — чек-лист: что проверить до покупки или начала работы. Формат: карточки.
Четверг — учебный пример: задача → действия → проверяемый результат. Формат: разбор.
Пятница — сравнение двух подходов по 3 критериям. Формат: таблица или карусель.
Суббота — ответы на реальные вопросы подписчиков. Формат: опрос и пост.
Воскресенье — итог недели, полезные ссылки и вопрос аудитории. Формат: дайджест.

Перед публикацией дополните каждый материал проверяемыми фактами, реальными примерами и собственным опытом.`;
}

export function FreeToolWorkshop() {
  const [kind, setKind] = useState<ToolId>('post');
  const [subject, setSubject] = useState('');
  const [audience, setAudience] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  function generate() {
    setResult(buildFreeResult(kind, subject, audience));
    setCopied(false);
  }

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section id="free-workshop" className="mx-auto max-w-5xl px-5 py-12 lg:px-8">
      <div className="rounded-[2rem] border border-[#f0d5b3] bg-white p-6 shadow-[0_18px_60px_rgba(46,39,77,.07)] md:p-9">
        <span className="text-xs font-black uppercase tracking-[0.16em] text-[#a34b08]">
          Без регистрации и API-кредитов
        </span>
        <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
          Получите первый результат прямо здесь
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-[#5f6470]">
          Это бесплатный конструктор шаблонов, а не платная генерация нейросетью. Вы получите текст,
          который можно адаптировать и скопировать.
        </p>

        <form
          className="mt-8 grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            generate();
          }}
        >
          <fieldset>
            <legend className="mb-2 font-bold">Что хотите подготовить?</legend>
            <div className="grid gap-2 md:grid-cols-3">
              {options.map((option) => (
                <label
                  key={option.id}
                  className={`cursor-pointer rounded-xl border p-3 ${kind === option.id ? 'border-[#b84e00] bg-[#fff1e3]' : 'border-black/10'}`}
                >
                  <input
                    type="radio"
                    name="tool"
                    value={option.id}
                    checked={kind === option.id}
                    onChange={() => {
                      setKind(option.id);
                      setResult('');
                    }}
                    className="mr-2 accent-[#b84e00]"
                  />
                  <span className="font-bold">{option.label}</span>
                  <span className="mt-2 block text-xs leading-5 text-[#626873]">
                    {option.explanation}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block font-bold">
            Тема или ваш продукт
            <input
              type="text"
              value={subject}
              onChange={(event) => {
                setSubject(event.target.value);
                setResult('');
              }}
              maxLength={180}
              required
              placeholder="Например: подбор новостройки"
              className="mt-2 block w-full rounded-xl border border-black/20 p-3 font-normal outline-none focus:border-[#b84e00]"
            />
          </label>
          <label className="block font-bold">
            Для кого это?
            <input
              type="text"
              value={audience}
              onChange={(event) => {
                setAudience(event.target.value);
                setResult('');
              }}
              maxLength={160}
              required
              placeholder="Например: люди, которые выбирают первую квартиру"
              className="mt-2 block w-full rounded-xl border border-black/20 p-3 font-normal outline-none focus:border-[#b84e00]"
            />
          </label>
          <button
            type="submit"
            className="w-fit rounded-full bg-[#1f2430] px-7 py-3.5 font-bold text-white hover:bg-[#aa4807]"
          >
            Создать текст бесплатно →
          </button>
        </form>

        {result ? (
          <div
            className="mt-8 rounded-2xl border border-[#edc4a6] bg-[#fff9f3] p-5"
            data-testid="free-result"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-black">Ваш результат</h3>
              <button
                type="button"
                onClick={copy}
                className="rounded-full border border-black/20 bg-white px-4 py-2 font-bold"
              >
                {copied ? 'Скопировано' : 'Копировать результат'}
              </button>
            </div>
            <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-[#30343b]">
              {result}
            </pre>
          </div>
        ) : null}
      </div>
    </section>
  );
}
