'use client';

import { useState } from 'react';

export function LessonOnePractice() {
  const [task, setTask] = useState('');
  const [goal, setGoal] = useState('');
  const [input, setInput] = useState('');
  const [limits, setLimits] = useState('');
  const [format, setFormat] = useState('');
  const [ready, setReady] = useState('');
  const [notice, setNotice] = useState('');
  const complete = [task, goal, input, limits, format, ready].every(v => v.trim().length > 0);
  const prompt = ['Помоги мне решить рабочую задачу. Не выдумывай недостающие сведения.','Ситуация: '+task,'Цель: '+goal,'Исходные данные: '+input,'Ограничения: '+limits,'Формат результата: '+format,'Готово, когда: '+ready].join('\n');
  const fields = [
    {label:'Моя реальная задача',value:task,set:setTask,placeholder:'Например: ответить клиенту на вопрос об услуге'},
    {label:'Цель',value:goal,set:setGoal,placeholder:'Что должен сделать получатель после ответа?'},
    {label:'Исходные данные',value:input,set:setInput,placeholder:'Какие факты у меня уже есть?'},
    {label:'Ограничения',value:limits,set:setLimits,placeholder:'Что нельзя придумывать и менять?'},
    {label:'Формат результата',value:format,set:setFormat,placeholder:'Таблица, письмо, чек-лист, план?'},
    {label:'Критерий готовности',value:ready,set:setReady,placeholder:'Как проверить, что задача решена?'}
  ];
  return <section aria-labelledby="exercise-title" className="rounded-[2rem] border border-[#e6c8b0] bg-white p-6 shadow-sm md:p-9">
    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a6541c]">Практика по реальному заданию</p>
    <h2 id="exercise-title" className="mt-3 text-2xl font-black md:text-3xl">Собери свой первый рабочий запрос</h2>
    <p className="mt-3 leading-7 text-[#615965]">Впиши свои данные. Шесть полей помогут получить результат, который можно проверить. Никакой оплаты нейросети для этой практики не требуется.</p>
    <div className="mt-6 grid gap-4 md:grid-cols-2">{fields.map(field=><label key={field.label} className="block"><span className="mb-2 block text-sm font-bold text-[#29222f]">{field.label}</span><textarea rows={3} value={field.value} onChange={e=>{field.set(e.target.value);setNotice('');}} placeholder={field.placeholder} className="w-full resize-y rounded-xl border border-[#cfc4c0] bg-[#fffcf9] p-3 text-sm text-[#28212c] placeholder:text-[#8c8588] focus:border-[#bc6c42] focus:outline-none" /></label>)}</div>
    <div className="mt-6 rounded-2xl bg-[#f9f1ea] p-5"><h3 className="font-black text-[#2d2630]">Готовый запрос</h3><pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-[#504651]">{complete?prompt:'Заполни все шесть полей — здесь появится твой собственный запрос.'}</pre></div>
    <button type="button" disabled={!complete} onClick={async()=>{try {await navigator.clipboard.writeText(prompt);setNotice('Запрос скопирован. Отправь его в выбранную нейросеть и сравни результат с первоначальным запросом.');} catch {setNotice('Не удалось скопировать автоматически: выдели запрос и скопируй вручную.');}}} className="mt-5 rounded-full bg-[#28202e] px-6 py-3 font-bold text-white hover:bg-[#49354e] disabled:cursor-not-allowed disabled:opacity-40">Скопировать мой запрос</button>
    {notice&&<p role="status" className="mt-3 text-sm text-[#403441]">{notice}</p>}
    <p className="mt-4 text-xs leading-6 text-[#776e75]">Пока это тренажёр без сохранения в личном кабинете. Не вводи пароли, номера документов или чужие персональные данные. Открой другую вкладку перед отправкой запроса: при обновлении страницы поля могут очиститься.</p>
  </section>;
}
