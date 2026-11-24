'use client';

import { useEffect, useState } from 'react';
import { ModuleMomentum } from '@/components/public/ModuleMomentum';

type Lesson = {id:string;title:string;artifact:string;prompt:string;fields:string[];checks:string[]};

const lessons:Lesson[] = [
{id:"2.1",title:"Не придумывайте контент",artifact:"Situation_to_Expertise_01",prompt:"Из этой реальной ситуации найди 5 возможных экспертных углов. Не придумывай новых фактов. Для каждого дай: конфликт/вопрос, профессиональный вывод, кому это полезно и возможный формат. Ситуация: [вставьте].",fields:["Ситуация из последних трёх дней","Что зацепило","Мой профессиональный вывод","Кому полезно"],checks:["Ситуация реальная","Вывод профессиональный","Нет выдуманных фактов","Экспертные углы отличаются"]},
{id:"2.2",title:"Голосовое сильнее чистовика",artifact:"Voice_to_Content_01",prompt:"Ниже расшифровка моего голосового. Сначала ничего не переписывай. Выдели: 1) главную мысль; 2) 3 живые формулировки, которые стоит сохранить; 3) конфликт или вопрос; 4) мою позицию; 5) возможную структуру поста. Текст: [вставьте].",fields:["Главная мысль из голосового","Три мои живые фразы","Моя позиция","Два формата: пост и короткое видео"],checks:["Сохранены мои слова","Мысль ясна","Нет лишней литературности","Два формата из одного сырья"]},
{id:"2.3",title:"AI как интервьюер: достаём позицию",artifact:"Expert_Position_01",prompt:"Будь интервьюером. Тема: [вставьте]. Задай мне по одному 6 вопросов, чтобы достать конкретную позицию: опыт, пример, несогласие, граница, аргумент, вывод. Не предлагай ответы за меня. После моих ответов собери позицию в 3–5 предложений и отметь, что является моими словами, а что — твоей структурой.",fields:["Тема","С чем я не согласна / не согласен","Конкретный пример из опыта","Моя экспертная позиция"],checks:["Позиция опирается на ответы","Нет выдуманных кейсов","Есть граница","Формулировка конкретная"]},
{id:"2.4",title:"Как убрать AI-голос",artifact:"Anti_AI_Editor_v1",prompt:"Отредактируй текст как строгий редактор моего голоса. Не переписывай целиком. Найди места, где язык звучит шаблонно, стерильно, пафосно или неестественно. Для каждого покажи: «было → почему чужое → точечный вариант». Сохрани мои факты, позицию и живые фразы.",fields:["Чужая фраза","Почему я так не говорю","Мой вариант фразы","Что оставить без изменений"],checks:["Мой голос узнаваем","Факты не изменены","Нет лишних клише","Текст читается вслух"]}
];
const feedbackFields=['Что получилось лучше всего?','На каком уроке возникли трудности?','Чего не хватило в этом модуле?','Ваш отзыв о модуле'];
type RecordState={answers:string[][];checked:boolean[][];feedback:string[]};
const initial:RecordState={answers:lessons.map(l=>l.fields.map(()=>'')),checked:lessons.map(l=>l.checks.map(()=>false)),feedback:feedbackFields.map(()=>'')};
const storageKey='yoptet-module2-workbook-v1';

export function ModuleTwoWorkbook(){
 const [record,setRecord]=useState<RecordState>(initial);
 const [active,setActive]=useState(0);
 const [loaded,setLoaded]=useState(false);
 const [status,setStatus]=useState('');
 useEffect(()=>{
   const timeoutId = window.setTimeout(() => {
     try {
       const saved = window.localStorage.getItem(storageKey);
       if (saved) {
         const obj = JSON.parse(saved) as RecordState;
         if (obj.answers?.length === 4 && obj.checked?.length === 4 && obj.feedback?.length === 4) setRecord(obj);
       }
     } catch { /* storage unavailable: continue with temporary local state */ }
     setLoaded(true);
   }, 0);
   return () => window.clearTimeout(timeoutId);
 }, []);
 useEffect(()=>{if(loaded){try {window.localStorage.setItem(storageKey,JSON.stringify(record));}catch {/* storage blocked */}}},[loaded,record]);
 const setAnswer=(l:number,i:number,value:string)=>setRecord(old=>({...old,answers:old.answers.map((r,k)=>k===l?r.map((a,j)=>j===i?value:a):r)}));
 const setCheck=(l:number,i:number,value:boolean)=>setRecord(old=>({...old,checked:old.checked.map((r,k)=>k===l?r.map((a,j)=>j===i?value:a):r)}));
 const setFeedback=(i:number,value:string)=>setRecord(old=>({...old,feedback:old.feedback.map((a,j)=>j===i?value:a)}));
 const completeLesson=(i:number)=>record.answers[i].every(a=>a.trim().length>0)&&record.checked[i].every(Boolean);
 const done=lessons.filter((_,i)=>completeLesson(i)).length;
 const feedbackDone=record.feedback.every(a=>a.trim().length>0);
 const copyPrompt=async(p:string)=>{try {await navigator.clipboard.writeText(p);setStatus('Запрос скопирован.');}catch{setStatus('Копирование недоступно: выделите текст вручную.');}};
 const exportFile=()=>{
   const lines=['Нейробунт — РАБОЧАЯ ТЕТРАДЬ МОДУЛЯ 2','',...lessons.flatMap((l,i)=>[l.id+' '+l.title,'Сохраняемый результат: '+l.artifact,...l.fields.map((f,j)=>f+': '+record.answers[i][j]),...l.checks.map((ch,j)=>(record.checked[i][j]?'[x] ':'[ ] ')+ch),'']),...feedbackFields.map((f,i)=>f+': '+record.feedback[i])];
   const objectUrl=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}));
   const link=document.createElement('a');link.href=objectUrl;link.download='NEYROBUNT_Modul_2_Moi_rezultaty.txt';link.click();URL.revokeObjectURL(objectUrl);
   setStatus('Файл с ответами подготовлен для сохранения.');
 };
 const lesson=lessons[active];
 return <div className="mx-auto max-w-6xl space-y-7 px-4 py-10 lg:px-8">
   <section className="rounded-[2rem] bg-[#271d36] p-7 text-white md:p-10">
     <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ffbd92]">Нейробунт · РАБОЧАЯ ТЕТРАДЬ</p>
     <h1 className="mt-3 text-3xl font-black md:text-4xl">Ваш опыт в экспертном контенте</h1>
     <p className="mt-4 max-w-3xl leading-7 text-white/75">Четыре практических урока, четыре сохранённых результата. Работайте над собственной задачей. Ориентир на закрепление — 7–10 дней.</p>
     <div className="mt-6 flex flex-wrap items-center gap-3"><span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold">Выполнено: {done} из 4</span><span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold">Старт: можно бесплатно</span></div>
     <div aria-label="Прогресс тетради" className="mt-4 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#ff9255] transition-all" style={{width:(done/4*100)+'%'}}/></div>
   </section>
   <p className="rounded-xl border border-[#ead2c4] bg-[#fff4eb] p-4 text-sm leading-7 text-[#62443b]">Ответы сохраняются в браузере на этом устройстве, если разрешено локальное хранение. Это не серверная сдача домашнего задания. Чтобы не потерять работу, регулярно скачивайте свои ответы; на общем компьютере не вводите конфиденциальные сведения.</p>
   <div className="flex flex-wrap gap-2" aria-label="Выбор урока">{lessons.map((l,i)=><button type="button" key={l.id} onClick={()=>{setActive(i);setStatus('');}} className={active===i?'rounded-full bg-[#2b2138] px-4 py-2.5 text-sm font-bold text-white':'rounded-full border border-[#d8c4bc] bg-white px-4 py-2.5 text-sm font-bold text-[#473747]'}>{l.id} {completeLesson(i)?'✓':''}</button>)}</div>
   <section className="rounded-[1.8rem] border border-[#e4d8d0] bg-white p-6 md:p-9">
     <p className="text-xs font-black uppercase tracking-widest text-[#a74a2c]">Урок {lesson.id} · {lesson.artifact}</p>
     <h2 className="mt-3 text-2xl font-black md:text-3xl">{lesson.title}</h2>
     <h3 className="mt-7 font-black">Запрос из исходной программы</h3>
     <div className="mt-3 rounded-2xl bg-[#f4ecf7] p-4"><p className="whitespace-pre-wrap text-sm leading-7 text-[#34293a]">{lesson.prompt}</p><button type="button" onClick={()=>copyPrompt(lesson.prompt)} className="mt-3 rounded-full bg-[#2f223b] px-4 py-2 text-sm font-bold text-white">Скопировать запрос</button></div>
     <h3 className="mt-8 text-xl font-black">Моя работа</h3>
     <div className="mt-4 grid gap-4 md:grid-cols-2">{lesson.fields.map((f,i)=><label key={f} className="block"><span className="mb-2 block text-sm font-bold">{f}</span><textarea rows={4} value={record.answers[active][i]} onChange={e=>setAnswer(active,i,e.target.value)} placeholder="Запишите свой результат по реальной задаче" className="w-full rounded-xl border border-[#d7ccc9] p-3 text-sm focus:border-[#b3663c] focus:outline-none"/></label>)}</div>
     <h3 className="mt-7 font-black">Проверка результата</h3>
     <div className="mt-3 grid gap-3 md:grid-cols-2">{lesson.checks.map((ch,i)=><label key={ch} className="flex items-start gap-3 rounded-xl bg-[#faf6f3] p-3 text-sm"><input type="checkbox" checked={record.checked[active][i]} onChange={e=>setCheck(active,i,e.target.checked)} className="mt-0.4 h-4 w-4 accent-[#a64b2b]"/><span>{ch}</span></label>)}</div>
     <p className="mt-4 text-sm font-bold text-[#76414b]">{completeLesson(active)?'Урок заполнен и отмечен как проверенный.':'Заполните четыре поля и отметьте проверку, чтобы завершить этот урок.'}</p>
     <div className="mt-7 flex flex-wrap gap-3"><button type="button" disabled={active===0} onClick={()=>setActive(a=>Math.max(0,a-1))} className="rounded-full border border-[#d4c6c7] px-4 py-2.5 font-bold disabled:opacity-40">← Предыдущий</button><button type="button" disabled={active===3} onClick={()=>setActive(a=>Math.min(3,a+1))} className="rounded-full bg-[#282037] px-4 py-2.5 font-bold text-white disabled:opacity-40">Следующий урок →</button></div>
   </section>
   <section className="rounded-[1.8rem] border border-[#e6c9b6] bg-[#fff6ef] p-6 md:p-9">
     <h2 className="text-2xl font-black">Итоговый отзыв — обязательно</h2>
     <p className="mt-3 text-sm leading-7 text-[#66444b]">После пяти уроков расскажите, что получилось и чего не хватило. Отзыв может быть критическим: это помогает улучшать курс.</p>
     <div className="mt-4 grid gap-4 md:grid-cols-2">{feedbackFields.map((f,i)=><label key={f} className="block"><span className="mb-2 block text-sm font-bold">{f}</span><textarea value={record.feedback[i]} onChange={e=>setFeedback(i,e.target.value)} rows={4} className="w-full rounded-xl border border-[#d7ccc9] bg-white p-3 text-sm focus:border-[#b3663c] focus:outline-none" placeholder="Напишите своими словами"/></label>)}</div>
     <p className="mt-4 text-sm font-bold text-[#62443f]">{feedbackDone&&done===4?'Все поля заполнены. Сохраните итоговый файл.':'До подтверждения завершения модуля нужно выполнить четыре задания и написать отзыв.'}</p>
     <p className="mt-2 text-xs leading-6 text-[#746b70]">Это учебный интерфейс: реальная блокировка доступа к следующему модулю и приём отзывов преподавателем будут подключены отдельно.</p>
   </section>
   <ModuleMomentum moduleId={2} complete={done===4 && feedbackDone} completedLessons={done} totalLessons={4} practiceHref="/kursy-nejrosetey/programma" />
   <div className="flex flex-wrap gap-3"><button type="button" onClick={exportFile} className="rounded-full bg-[#291e37] px-6 py-3 font-bold text-white">Скачать мои ответы</button><a href="/kursy-nejrosetey/programma" className="rounded-full border border-[#cdb4a4] px-6 py-3 font-bold">Вернуться к программе</a></div>
   {status&&<p role="status" className="text-sm text-[#644268]">{status}</p>}
 </div>;
}
