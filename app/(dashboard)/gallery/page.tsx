import Link from 'next/link';

import { loadRecentFactoryArtifacts } from '@/lib/factory-chain/persistence';

function modeForArtifact(metadata: Record<string, unknown>): string {
  const modeId = typeof metadata.modeId === 'string' ? metadata.modeId : '';
  if (['video','image','stories','presentation','document','site','voice'].includes(modeId)) return modeId;
  const artifactType = typeof metadata.artifactType === 'string' ? metadata.artifactType : '';
  if (artifactType.includes('video')) return 'video';
  if (artifactType.includes('image') || artifactType.includes('campaign')) return 'image';
  if (artifactType.includes('music') || artifactType.includes('sound-effect')) return 'audio';
  return 'document';
}

function previewUrl(metadata: Record<string, unknown>): string | null {
  const outputUrl = typeof metadata.outputUrl === 'string' ? metadata.outputUrl : '';
  return outputUrl || null;
}

export default async function FactoryGalleryPage() {
  const artifacts = await loadRecentFactoryArtifacts(48);

  return (
    <main className="mx-auto w-full max-w-[1320px] pb-16 text-[#f7f2e8]">
      <section className="rounded-[34px] border border-white/[0.09] bg-[linear-gradient(145deg,#05070b,#0b1018_58%,#06080c)] p-6 sm:p-8">
        <p className="text-[12px] font-black uppercase tracking-[.18em] text-[#79eaf2]">БИЗНЕС-ЗАВОД · ГАЛЕРЕЯ</p>
        <h1 className="mt-3 text-[clamp(2.8rem,5vw,5.2rem)] font-black leading-[.94] tracking-[-.055em] text-[#fff8e7]">
          Всё, что
          <span className="block text-[#f1c96c]">завод уже произвёл.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-white/58">
          Откройте результат, вернитесь в проект или повторите удачную механику с новым контекстом.
        </p>
      </section>

      {artifacts.length ? (
        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {artifacts.map((artifact) => {
            const mode = modeForArtifact(artifact.metadata);
            const media = previewUrl(artifact.metadata);
            const remixHref =
              mode === 'audio'
                ? artifact.metadata.artifactType === 'music'
                  ? '/modules/create/music?project=' + encodeURIComponent(artifact.projectId)
                  : '/modules/create/sound-effects?project=' + encodeURIComponent(artifact.projectId)
                : '/modules/create/studio?mode=' + encodeURIComponent(mode) +
                  '&project=' + encodeURIComponent(artifact.projectId) +
                  '&artifact=' + encodeURIComponent(artifact.id);

            return (
              <article key={artifact.id} className="overflow-hidden rounded-[24px] border border-white/[0.09] bg-[#080c12]">
                {media ? (
                  <div className="aspect-video overflow-hidden bg-black/30">
                    {mode === 'video' ? (
                      <video src={media} muted playsInline controls className="h-full w-full object-cover" />
                    ) : mode === 'audio' ? (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-5">
                        <span className="text-4xl text-[#f1c96c]">♪</span>
                        <audio src={media} controls className="w-full" />
                      </div>
                    ) : (
                      <img src={media} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(105,228,238,.08),transparent_65%)]">
                    <span className="text-3xl font-black text-[#79eaf2]/40">{artifact.stage.toUpperCase()}</span>
                  </div>
                )}
                <div className="p-5">
                  <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#79eaf2]/65">{artifact.stage}</p>
                  <h2 className="mt-2 text-xl font-black text-[#fff8e7]">{artifact.title}</h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/48">{artifact.content}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link href={remixHref} className="rounded-xl bg-[#f1c96c] px-3.5 py-2.5 text-xs font-black text-[#1b1105]">
                      Повторить / ремикс
                    </Link>
                    <Link href={'/projects/' + artifact.projectId} className="rounded-xl border border-white/[0.09] px-3.5 py-2.5 text-xs font-black text-white/62">
                      Проект →
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="mt-5 rounded-[28px] border border-white/[0.08] bg-[#080c12] p-12 text-center">
          <p className="text-xl font-black text-[#fff8e7]">Галерея пока пустая</p>
          <p className="mt-2 text-sm text-white/48">Первый готовый результат автоматически появится здесь.</p>
          <Link href="/factories" className="mt-5 inline-flex rounded-xl bg-[#f1c96c] px-4 py-3 text-sm font-black text-[#1b1105]">
            Запустить первый завод →
          </Link>
        </section>
      )}
    </main>
  );
}
