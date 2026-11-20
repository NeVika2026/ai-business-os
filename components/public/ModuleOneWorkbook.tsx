'use client';

import { useEffect, useState } from 'react';
import { ModuleMomentum } from '@/components/public/ModuleMomentum';

type Lesson = {id:string;title:string;artifact:string;prompt:string;fields:string[];checks:string[]};

const lessons:Lesson[] = [
{id:'1.1',title:'Не промпт, а задача',artifact:'Task_Brief_01',
 prompt:'Помоги превратить мой сырой запрос в рабочую задачу. Сначала выдели: цель, контекст, входные данные, ограничения, формат результата и критерии готовности. Не решай задачу, пока не покажешь мне эту структуру. Мой запрос: [вставьте].',
 fields:['Моя рабочая задача','Цель и подтверждённые данные','Ограничения и формат','Готово, когда...'],
 checks:['Цель измерима','Факты отделены от пожеланий','Формат определён','Критерий готовности есть']},
{id:'1.2',title:'Контекст, который меняет всё',artifact:'Context_Card_v1',
 prompt:'Раздели мой контекст на три блока: 1) постоянный — пригодится во многих задачах; 2) разовый — нужен только сейчас; 3) не нужен или рискован для передачи. Объясни, почему каждый пункт попал в свой блок. Контекст: [вставьте].',
 fields:['Постоянные правила и стиль','Разовые данные для этой задачи','Что нельзя передавать','Когда следует обновить контекст'],
 checks:['Нет лишних персональных данных','Постоянное и разовое разделены','Контекст влияет на ответ','Определена дата пересмотра']},
{id:'1.3',title:'Формат результата и критерий готовности',artifact:'Output_Spec_v1',
 prompt:'Предложи 3 формата результата для моей задачи и объясни, какой лучше. Задача: [вставьте]. Следующее действие после ответа: [что я буду делать]. Затем выдай шаблон выбранного формата с обязательными полями.',
 fields:['Следующее действие после ответа','Выбранный формат','Обязательные поля','Критерии готовности'],
 checks:['Формат соответствует действию','Нет лишних полей','Результат можно использовать','Понятно, что проверить']},
{id:'1.4',title:'Итерации вместо магического промпта',artifact:'Iteration_Log_01',
 prompt:'Не переписывай всё. Сначала оцени текущую версию по критериям [список]. Назови одну главную проблему. Предложи точечную правку только для неё. После моей команды сравни версии и проведи финальный аудит.',
 fields:['Версия 1','Главная проблема','Точечная правка','Что стало лучше'],
 checks:['Правка точечная','Удачное сохранено','Версии сравнимы','Финальный аудит выполнен']},
{id:'1.5',title:'Когда ChatGPT врёт: проверка и границы',artifact:'Factcheck_Rules_v1',
 prompt:'Разметь ответ на три типа: ФАКТ, ВЫВОД, ПРЕДПОЛОЖЕНИЕ. Для каждого факта напиши, какой первичный источник нужен и насколько критична ошибка. Не придумывай источники. Если данных не хватает — пометь «нужно проверить».',
 fields:['Факт или утверждение','Первичный источник и дата','Цена ошибки','Кто принимает решение'],
 checks:['Факты отделены от выводов','Источник первичный','Актуальность учтена','Решение остаётся у человека']}
];
const feedbackFields=['Что получилось лучше всего?','На каком уроке возникли трудности?','Чего не хватило в этом модуле?','Ваш отзыв о модуле'];
type RecordState={answers:string[][];checked:boolean[][];feedback:string[]};
const initial:RecordState={answers:lessons.map(l=>l.fields.map(()=>'')),checked:lessons.map(l=>l.checks.map(()=>false)),feedback:feedbackFields.map(()=>'')};
const storageKey='yoptet-module1-workbook-v1';

export function ModuleOneWorkbook(){
 const [record,setRecord]=useState<RecordState>(initial);
 const [active,setActive]=useState(0);
 const [loaded,setLoaded]=useState(false);
 const [status,setStatus]=useState('');
 useEffect(()=>{
   try {
     const saved=window.localStorage.getItem(storageKey);
     if(saved){const obj=JSON.parse(saved) as RecordState;
       if(obj.answers?.length===5 && obj.checked?.length===5 && obj.feedback?.length===4) setRecord(obj);
     }
   }catch { /* storage unavailable: continue with temporary local state */ }
   setLoaded(true);
 },[]);
 useEffect(()=>{if(loaded){try {window.localStorage.setItem(storageKey,JSON.stringify(record));}catch {/* storage blocked */}}},[loaded,record]);
 const setAnswer=(l:number,i:number,value:string)=>setRecord(old=>({...old,answers:old.answers.map((r,k)=>k===l?r.map((a,j)=>j===i?value:a):r)}));
 const setCheck=(l:number,i:number,value:boolean)=>setRecord(old=>({...old,checked:old.checked.map((r,k)=>k===l?r.map((a,j)=>j===i?value:a):r)}));
 const setFeedback=(i:number,value:string)=>setRecord(old=>({...old,feedback:old.feedback.map((a,j)=>j===i?value:a)}));
 const completeLesson=(i:number)=>record.answers[i].every(a=>a.trim().length>0)&&record.checked[i].every(Boolean);
 const done=lessons.filter((_,i)=>completeLesson(i)).length;
 const feedbackDone=record.feedback.every(a=>a.trim().length>0);
 const copyPrompt=async(p:string)=>{try {await navigator.clipboard.writeText(p);setStatus('Запрос скопирован.');}catch{setStatus('Копирование недоступно: выделите текст вручную.');}};
 const exportFile=()=>{
   const lines=['ЁПТЕТЬ ДА НУ! — РАБОЧАЯ ТЕТРАДЬ МОДУЛЯ 1','',...lessons.flatMap((l,i)=>[l.id+' '+l.title,'Сохраняемый результат: '+l.artifact,...l.fields.map((f,j)=>f+': '+record.answers[i][j]),...l.checks.map((ch,j)=>(record.checked[i][j]?'[x] ':'[ ] ')+ch),'']),...feedbackFields.map((f,i)=>f+': '+record.feedback[i])];
   const objectUrl=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}));
   const link=document.createElement('a');link.href=objectUrl;link.download='YOPTET_Modul_1_Moi_rezultaty.txt';link.click();URL.revokeObjectURL(objectUrl);
   setStatus('Файл с ответами подготовлен для сохранения.');
 };
 const lesson=lessons[active];
 return <div className="mx-auto max-w-6xl space-y-7 px-5 py-10 lg:px-8">
   <section className="rounded-[2rem] bg-[#271d36] p-7 text-white md:p-10">
     <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ffbd92]">ЁПТЕТЬ ДА НУ! · РАБОЧАЯ ТЕТРАДЬ</p>
     <h1 className="mt-3 text-3xl font-black md:text-5xl">ChatGPT для работы</h1>
     <p className="mt-4 max-w-3xl leading-7 text-white/75">Пять практических уроков, пять сохранённых результатов. Работайте над собственной задачей. Ориентир на закрепление — 7 дней.</p>
     <div className="mt-6 flex flex-wrap items-center gap-3"><span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold">Выполнено: {done} из 5</span><span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold">Старт: можно бесплатно</span></div>
     <div aria-label="Прогресс тетради" className="mt-4 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#ff9255] transition-all" style={{width:(done/5*100)+'%'}}/></div>
   </section>
   <p className="rounded-xl border border-[#ead2c4] bg-[#fff5eb] p-4 text-sm leading-7 text-[#62453b]">Ответы сохраняются в браузере на этом устройстве, если разрешено локальное хранение. Это не серверная сдача домашнего задания. Чтобы не потерять работу, регулярно скачивайте свои ответы; на общем компьютере не вводите конфиденциальные сведения.</p>
   <div className="flex flex-wrap gap-2" aria-label="Выбор урока">{lessons.map((l,i)=><button type="button" key={l.id} onClick={()=>{setActive(i);setStatus('');}} className={active===i?'rounded-full bg-[#2b2138] px-4 py-2.5 text-sm font-bold text-white':'rounded-full border border-[#d8c5bc] bg-white px-4 py-2.5 text-sm font-bold text-[#473747]'}>{l.id} {completeLesson(i)?'✓':''}</button>)}</div>
   <section className="rounded-[1.8rem] border border-[#e5d8d0] bg-white p-6 md:p-9">
     <p className="text-xs font-black uppercase tracking-widest text-[#a75a2c]">Урок {lesson.id} · {lesson.artifact}</p>
     <h2 className="mt-3 text-2xl font-black md:text-3xl">{lesson.title}</h2>
     <h3 className="mt-7 font-black">Запрос из исходной программы</h3>
     <div className="mt-3 rounded-2xl bg-[#f5ecf7] p-5"><p className="whitespace-pre-wrap text-sm leading-7 text-[#34293a]">{lesson.prompt}</p><button type="button" onClick={()=>copyPrompt(lesson.prompt)} className="mt-3 rounded-full bg-[#2f223b] px-4 py-2 text-sm font-bold text-white">Скопировать запрос</button></div>
     <h3 className="mt-8 text-xl font-black">Моя работа</h3>
     <div className="mt-5 grid gap-5 md:grid-cols-2">{lesson.fields.map((f,i)=><label key={f} className="block"><span className="mb-2 block text-sm font-bold">{f}</span><textarea rows={4} value={record.answers[active][i]} onChange={e=>setAnswer(active,i,e.target.value)} placeholder="Запишите свой результат по реальной задаче" className="w-full rounded-xl border border-[#d7ccc9] p-3 text-sm focus:border-[#b3663c] focus:outline-none"/></label>)}</div>
     <h3 className="mt-7 font-black">Проверка результата</h3>
     <div className="mt-3 grid gap-3 md:grid-cols-2">{lesson.checks.map((ch,i)=><label key={ch} className="flex items-start gap-3 rounded-xl bg-[#faf6f3] p-3 text-sm"><input type="checkbox" checked={record.checked[active][i]} onChange={e=>setCheck(active,i,e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#a65b2b]"/><span>{ch}</span></label>)}</div>
     <p className="mt-5 text-sm font-bold text-[#76515b]">{completeLesson(active)?'Урок заполнен и отмечен как проверенный.':'Заполните четыре поля и отметьте проверку, чтобы завершить этот урок.'}</p>
     <div className="mt-7 flex flex-wrap gap-3"><button type="button" disabled={active===0} onClick={()=>setActive(a=>Math.max(0,a-1))} className="rounded-full border border-[#d5c6c7] px-5 py-2.5 font-bold disabled:opacity-40">← Предыдущий</button><button type="button" disabled={active===4} onClick={()=>setActive(a=>Math.min(4,a+1))} className="rounded-full bg-[#282037] px-5 py-2.5 font-bold text-white disabled:opacity-40">Следующий урок →</button></div>
   </section>
   <section className="rounded-[1.8rem] border border-[#e6c9b6] bg-[#fff6ef] p-6 md:p-9">
     <h2 className="text-2xl font-black">Итоговый отзыв — обязательно</h2>
     <p className="mt-3 text-sm leading-7 text-[#66555b]">После пяти уроков расскажите, что получилось и чего не хватило. Отзыв может быть критическим: это помогает улучшать курс.</p>
     <div className="mt-5 grid gap-5 md:grid-cols-2">{feedbackFields.map((f,i)=><label key={f} className="block"><span className="mb-2 block text-sm font-bold">{f}</span><textarea value={record.feedback[i]} onChange={e=>setFeedback(i,e.target.value)} rows={4} className="w-full rounded-xl border border-[#d7ccc9] bg-white p-3 text-sm focus:border-[#b3663c] focus:outline-none" placeholder="Напишите своими словами"/></label>)}</div>
     <p className="mt-5 text-sm font-bold text-[#62443f]">{feedbackDone&&done===5?'Все поля заполнены. Сохраните итоговый файл.':'До подтверждения завершения модуля нужно выполнить пять заданий и написать отзыв.'}</p>
     <p className="mt-2 text-xs leading-6 text-[#756b70]">Это учебный интерфейс: реальная блокировка доступа к следующему модулю и приём отзывов преподавателем будут подключены отдельно.</p>
   </section>
   <ModuleMomentum moduleId={1} complete={done===5 && feedbackDone} completedLessons={done} totalLessons={5} practiceHref="/kursy-nejrosetey/programma" />
   <div className="flex flex-wrap gap-3"><button type="button" onClick={exportFile} className="rounded-full bg-[#291e37] px-6 py-3 font-bold text-white">Скачать мои ответы</button><a href="/kursy-nejrosetey/programma" className="rounded-full border border-[#cdb4a5] px-6 py-3 font-bold">Вернуться к программе</a></div>
   {status&&<p role="status" className="text-sm text-[#655268]">{status}</p>}
 </div>;
}
