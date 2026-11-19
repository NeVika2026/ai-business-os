'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildFreeResult } from '@/components/public/FreeToolWorkshop';
import styles from './MiniStudio.module.css';

export type StudioMode = 'tekst' | 'kartinka' | 'video';
type TextType = 'post' | 'offer' | 'plan';
type ColorTheme = 'orange' | 'blue' | 'mono';

const definitions = {
  tekst: {
    small: 'ТЕКСТОВАЯ МАСТЕРСКАЯ',
    title: 'Напишем текст.',
    intro: 'Скажи, о чём написать и для кого. Получишь готовый черновик.',
    label: 'Текст',
  },
  kartinka: {
    small: 'МАСТЕРСКАЯ КАРТИНОК',
    title: 'Сделаем картинку.',
    intro: 'Придумай заголовок. Получишь красивую обложку, которую можно сохранить.',
    label: 'Картинка',
  },
  video: {
    small: 'ВИДЕОМАСТЕРСКАЯ',
    title: 'Оживим надпись.',
    intro: 'Напиши пару слов. Получишь короткую анимированную видеозаставку.',
    label: 'Видео',
  },
} as const;

const themes = {
  orange: { one: '#15151f', two: '#492519', accent: '#ff851f', light: '#ffcf91', text: '#fff7ea' },
  blue: { one: '#0c1731', two: '#153d57', accent: '#40bde0', light: '#a9edff', text: '#f1fbff' },
  mono: { one: '#131313', two: '#3a3a3a', accent: '#ececec', light: '#c8c8c8', text: '#ffffff' },
} as const;

function xmlEscape(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function wrapTitle(value: string, maxLength = 18): string[] {
  const words = value.trim().replace(/\s+/g, ' ').split(' ');
  const lines: string[] = [];
  for (const word of words) {
    const last = lines.length - 1;
    if (last >= 0 && (lines[last] + ' ' + word).length <= maxLength) lines[last] += ' ' + word;
    else if (word.length <= maxLength) lines.push(word);
    else {
      for (let j = 0; j < word.length; j += maxLength) lines.push(word.slice(j, j + maxLength));
    }
  }
  return lines.slice(0, 4).length ? lines.slice(0, 4) : ['ТВОЯ ИДЕЯ'];
}

export function makeCoverSvg(title: string, subtitle: string, theme: ColorTheme) {
  const c = themes[theme];
  const lines = wrapTitle(title.trim().slice(0, 70));
  const rows = lines.map((line, index) => '<tspan x="88" dy="' + (index === 0 ? 0 : 112) + '">' + xmlEscape(line) + '</tspan>').join('');
  return '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">' +
    '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="' + c.one + '"/><stop offset="1" stop-color="' + c.two + '"/></linearGradient>' +
    '<radialGradient id="glow"><stop stop-color="' + c.accent + '" stop-opacity=".54"/><stop offset="1" stop-color="' + c.accent + '" stop-opacity="0"/></radialGradient></defs>' +
    '<rect width="1080" height="1080" fill="url(#bg)"/><circle cx="800" cy="440" r="440" fill="url(#glow)"/>' +
    '<g transform="translate(760 430) rotate(-21)"><circle cx="0" cy="0" r="220" fill="none" stroke="' + c.accent + '" stroke-opacity=".70" stroke-width="24"/>' +
    '<circle cx="0" cy="0" r="160" fill="none" stroke="' + c.light + '" stroke-opacity=".55" stroke-width="5"/>' +
    '<path d="M-160 -30 L-20 -170 L150 40" fill="none" stroke="' + c.accent + '" stroke-width="20" stroke-linecap="round"/></g>' +
    '<rect x="56" y="54" width="968" height="972" rx="32" fill="none" stroke="' + c.light + '" stroke-opacity=".23" stroke-width="3"/>' +
    '<text x="88" y="140" fill="' + c.light + '" font-family="Arial,sans-serif" font-weight="bold" font-size="31" letter-spacing="6">БИЗНЕС-ЗАВОД AI</text>' +
    '<text x="88" y="500" fill="' + c.text + '" font-family="Arial,sans-serif" font-weight="900" font-size="88" letter-spacing="-3">' + rows + '</text>' +
    '<text x="88" y="960" fill="' + c.light + '" font-family="Arial,sans-serif" font-size="34">' + xmlEscape(subtitle.trim().slice(0, 65)) + '</text>' +
    '<path d="M88 1000 H992" stroke="' + c.accent + '" stroke-width="9"/></svg>';
}

function fitCanvasText(ctx: CanvasRenderingContext2D, text: string, limit: number, initialSize: number) {
  let size = initialSize;
  ctx.font = '900 ' + size + 'px Arial, sans-serif';
  while (ctx.measureText(text).width > limit && size > 32) {
    size -= 2;
    ctx.font = '900 ' + size + 'px Arial, sans-serif';
  }
  return size;
}

function drawVideoFrame(ctx: CanvasRenderingContext2D, input: string, progress: number, theme: ColorTheme) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  const c = themes[theme];
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, c.one); bg.addColorStop(1, c.two);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

  const pulse = 0.58 + 0.22 * Math.sin(progress * Math.PI * 4);
  ctx.save();
  ctx.translate(w * (0.72 + Math.sin(progress * Math.PI * 2) * 0.035), h * 0.47);
  ctx.rotate(progress * Math.PI * 0.32);
  for (let i = 0; i < 4; i++) {
    ctx.beginPath(); ctx.ellipse(0, 0, 95 + i * 44, 95 + i * 44, 0, 0, Math.PI * 2);
    ctx.strokeStyle = c.accent; ctx.globalAlpha = pulse * (0.8 - i * 0.15);
    ctx.lineWidth = 8 - i; ctx.stroke();
  }
  ctx.restore(); ctx.globalAlpha = 1;

  const reveal = Math.min(1, Math.max(0, (progress - 0.10) / 0.22));
  ctx.fillStyle = c.light; ctx.font = 'bold 23px Arial'; ctx.fillText('БИЗНЕС-ЗАВОД AI  /  ВИДЕО', 55, 62);
  ctx.save(); ctx.globalAlpha = reveal; ctx.fillStyle = c.text;
  fitCanvasText(ctx, input.trim().slice(0, 56) || 'ВАША ИДЕЯ', w - 110, 88);
  ctx.fillText(input.trim().slice(0, 56) || 'ВАША ИДЕЯ', 55, h / 2);
  ctx.restore();

  ctx.fillStyle = c.accent; ctx.fillRect(55, h - 91, (w - 110) * progress, 8);
  ctx.fillStyle = c.light; ctx.font = '24px Arial'; ctx.fillText('ИДЕЯ  →  ДВИЖЕНИЕ', 55, h - 48);
}

export function MiniStudio({ mode }: { mode: StudioMode }) {
  const config = definitions[mode];
  const [format, setFormat] = useState<TextType>('post');
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [textResult, setTextResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [imageTitle, setImageTitle] = useState('ВАША ИДЕЯ');
  const [subtitle, setSubtitle] = useState('Сделано в Бизнес-заводе');
  const [videoTitle, setVideoTitle] = useState('ЭТО МОЙ ПЕРВЫЙ РОЛИК');
  const [theme, setTheme] = useState<ColorTheme>('orange');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoUrlRef = useRef<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState('');
  const imageSvg = useMemo(() => makeCoverSvg(imageTitle, subtitle, theme), [imageTitle, subtitle, theme]);

  useEffect(() => () => {
    if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
  }, []);

  function downloadImage() {
    const blobUrl = URL.createObjectURL(new Blob([imageSvg], { type: 'image/svg+xml;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = blobUrl; link.download = 'business-zavod-cover.svg';
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  }

  async function copyText() {
    try { await navigator.clipboard.writeText(textResult); setCopied(true); }
    catch { setError('Не удалось скопировать автоматически. Выделите текст и скопируйте вручную.'); }
  }

  function createVideo() {
    setError(''); setVideoUrl(null);
    if (videoUrlRef.current) { URL.revokeObjectURL(videoUrlRef.current); videoUrlRef.current = null; }
    const canvas = document.createElement('canvas'); canvas.width = 960; canvas.height = 540;
    const ctx = canvas.getContext('2d');
    if (!ctx || typeof canvas.captureStream !== 'function' || typeof MediaRecorder === 'undefined') {
      setError('Этот браузер не умеет сохранять видео. Попробуйте открыть страницу в Chrome на компьютере.');
      return;
    }
    let stream: MediaStream;
    let recorder: MediaRecorder;
    try {
      stream = canvas.captureStream(24);
      const supported = ['video/webm;codecs=vp8', 'video/webm'].find((value) => MediaRecorder.isTypeSupported(value));
      recorder = supported ? new MediaRecorder(stream, { mimeType: supported }) : new MediaRecorder(stream);
    } catch {
      setError('Браузер не смог запустить запись видео. Попробуйте Chrome.');
      return;
    }
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => { if (event.data.size > 0) chunks.push(event.data); };
    recorder.onerror = () => { setError('Ошибка записи видео. Попробуйте ещё раз.'); setRendering(false); };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      if (!chunks.length) { setError('Видео не сохранилось. Попробуйте ещё раз.'); setRendering(false); return; }
      const result = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType || 'video/webm' }));
      videoUrlRef.current = result; setVideoUrl(result); setRendering(false);
    };

    const started = performance.now(); setRendering(true);
    drawVideoFrame(ctx, videoTitle, 0, theme);
    try { recorder.start(200); }
    catch {
      stream.getTracks().forEach((track) => track.stop());
      setRendering(false); setError('Не удалось запустить запись видео.'); return;
    }
    function tick(time: number) {
      const progress = Math.min(1, (time - started) / 4800);
      drawVideoFrame(ctx!, videoTitle, progress, theme);
      if (progress < 1 && recorder.state !== 'inactive') requestAnimationFrame(tick);
      else if (recorder.state !== 'inactive') recorder.stop();
    }
    requestAnimationFrame(tick);
  }

  return (
    <main className={styles.site} data-kind={mode}>
      <div className={styles.grain} aria-hidden="true" />
      <header className={styles.header}>
        <Link href="/" className={styles.logo}><b>БЗ</b><span>БИЗНЕС-ЗАВОД <em>AI</em></span></Link>
        <Link href="/" className={styles.back}>← На главную</Link>
      </header>
      <div className={styles.container}>
        <section className={styles.titleBlock}>
          <div className={styles.eyebrow}><span className={styles.statusDot}/> {config.small}</div>
          <h1>{config.title}</h1>
          <p>{config.intro}</p>
        </section>
        <div className={styles.columns}>
          <section className={styles.panel} aria-label="Создать результат">
            <div className={styles.panelHeading}><span>01</span><h2>Давай попробуем</h2></div>

            {mode === 'tekst' && (
              <form className={styles.form} onSubmit={(e) => { e.preventDefault(); setTextResult(buildFreeResult(format, topic, audience)); setCopied(false); setError(''); }}>
                <label>Что пишем?
                  <select value={format} onChange={(e) => {setFormat(e.target.value as TextType);setTextResult('');}}>
                    <option value="post">Пост для соцсетей</option>
                    <option value="offer">Сообщение клиенту</option>
                    <option value="plan">План постов на неделю</option>
                  </select>
                </label>
                <label>О чём написать?
                  <input required maxLength={180} value={topic} onChange={(e) => {setTopic(e.target.value);setTextResult('');}} placeholder="Например: подбор квартиры"/>
                </label>
                <label>Для кого?
                  <input required maxLength={160} value={audience} onChange={(e) => {setAudience(e.target.value);setTextResult('');}} placeholder="Например: для молодых семей"/>
                </label>
                <button className={styles.primary} type="submit">Создать текст <span>↗</span></button>
                <p className={styles.notice}>Бесплатный шаблон. Нейросеть и API-кредиты не используются.</p>
              </form>
            )}

            {mode === 'kartinka' && (
              <div className={styles.form}>
                <label>Что напишем на картинке?
                  <input maxLength={70} value={imageTitle} onChange={(e) => setImageTitle(e.target.value)} placeholder="Например: Большая распродажа"/>
                </label>
                <label>Маленькая подпись
                  <input maxLength={65} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Например: Только сегодня"/>
                </label>
                <label>Цвет
                  <select value={theme} onChange={(e) => setTheme(e.target.value as ColorTheme)}>
                    <option value="orange">Тёплый оранжевый</option>
                    <option value="blue">Космический синий</option>
                    <option value="mono">Чёрно-белый</option>
                  </select>
                </label>
                <button className={styles.primary} type="button" onClick={downloadImage}>Скачать картинку <span>↓</span></button>
                <p className={styles.notice}>Это бесплатная графическая обложка SVG. Генерация AI-фото пока не подключена.</p>
              </div>
            )}

            {mode === 'video' && (
              <div className={styles.form}>
                <label>Что напишем на видео?
                  <input maxLength={56} value={videoTitle} onChange={(e) => { setVideoTitle(e.target.value); setVideoUrl(null); }} placeholder="Например: Скоро открытие"/>
                </label>
                <label>Цвет заставки
                  <select value={theme} onChange={(e) => setTheme(e.target.value as ColorTheme)}>
                    <option value="orange">Оранжевый</option>
                    <option value="blue">Синий</option>
                    <option value="mono">Чёрно-белый</option>
                  </select>
                </label>
                <button className={styles.primary} type="button" onClick={createVideo} disabled={rendering || !videoTitle.trim()}>
                  {rendering ? 'Создаю видеозаставку…' : 'Сделать видео'} <span>{rendering ? '…' : '↗'}</span>
                </button>
                <p className={styles.notice}>4–5 секунд анимированного текста, формат WebM. Это не AI-мультфильм.</p>
              </div>
            )}
            {error && <p role="alert" className={styles.error}>{error}</p>}
          </section>

          <section className={styles.previewPanel} aria-label="Ваш результат">
            <div className={styles.previewHeading}><span>02</span><h2>{mode === 'tekst' ? 'Твой результат' : 'Так это выглядит'}</h2></div>

            {mode === 'tekst' && (textResult ?
              <div className={styles.output}>
                <pre>{textResult}</pre>
                <button type="button" className={styles.copy} onClick={copyText}>{copied ? 'Скопировано ✓' : 'Скопировать текст'}</button>
              </div> :
              <div className={styles.illustration}><span className={styles.paperIcon}>Аа</span><p>Твой текст появится здесь.</p></div>
            )}

            {mode === 'kartinka' && <div className={styles.imagePreview}>
              <img src={'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(imageSvg)} alt="Предпросмотр вашей графической обложки" width="1080" height="1080" />
              <p>Готово к скачиванию · 1080 × 1080</p>
            </div>}

            {mode === 'video' && <div className={styles.videoPreview}>
              {videoUrl ? <video key={videoUrl} src={videoUrl} controls playsInline className={styles.resultVideo}/> :
                <div className={styles.motion}>
                  <div className={styles.motionHalo}/>
                  <span className={styles.motionLabel}>БИЗНЕС-ЗАВОД AI / ВИДЕО</span>
                  <strong>{videoTitle || 'ВАША ИДЕЯ'}</strong>
                  <small>ИДЕЯ → ДВИЖЕНИЕ</small>
                </div>
              }
              {videoUrl && <a className={styles.copy} href={videoUrl} download="business-zavod-intro.webm">Скачать видео ↓</a>}
              <p>Предпросмотр заставки. Сохраняем видео прямо в браузере, без загрузки данных на сервер.</p>
            </div>}
          </section>
        </div>
        <div className={styles.bottom}>Сделал первый результат? <Link href="/">Вернуться и выбрать другое ↗</Link></div>
      </div>
    </main>
  );
}
