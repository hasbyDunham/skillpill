import { ExternalLink } from 'lucide-react';
import { ReferenceItem } from '../../types';
import { Language } from '../../lib/translations';

interface ReferenceCenterProps {
  references: ReferenceItem[];
  lang?: Language;
}

export default function ReferenceCenter({ references, lang = 'ID' }: ReferenceCenterProps) {
  const isID = lang === 'ID';
  return (
    <div className="space-y-6 font-sans text-stone-850 animate-in fade-in duration-300">
      <div className="border-b border-stone-200 pb-4 dark:border-stone-800">
        <span className="rounded-md bg-brand-500/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-brand-500">
          {isID ? 'Modul 9: Sitasi akademik' : 'Module 9: Academic citations'}
        </span>
        <h2 className="mt-1 text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-white">{isID ? 'Pusat Referensi' : 'Reference Center'}</h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {isID ? 'Bukti ilmiah, buku, dan publikasi tepercaya yang mendukung materi SkillPill ini.' : 'Scientific evidence, textbooks, and trusted publications supporting this SkillPill.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {references.length === 0 ? (
          <div className="col-span-2 rounded-xl border border-stone-200 bg-stone-50 py-10 text-center text-xs text-stone-500 dark:border-stone-800 dark:bg-stone-900">
            {isID ? 'Belum ada referensi yang tersedia.' : 'No active references are available yet.'}
          </div>
        ) : references.map((reference) => (
          <article
            key={reference.id}
            className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5 transition-all hover:shadow-sm dark:border-stone-800 dark:bg-stone-900"
          >
            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <span className="rounded bg-brand-50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  {reference.type}
                </span>
                {reference.url && (
                  <a
                    href={reference.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${isID ? 'Buka referensi' : 'Open reference'} ${reference.title}`}
                    className="rounded p-1 text-stone-400 transition-colors hover:text-brand-500"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
              <h4 className="text-xs font-extrabold leading-tight text-stone-900 dark:text-white">{reference.title}</h4>
              {reference.author && <p className="text-[10px] font-bold text-stone-400">{isID ? 'Oleh' : 'By'} {reference.author}</p>}
              {reference.description && <p className="pt-1 text-[11px] leading-normal text-stone-600 dark:text-stone-300">{reference.description}</p>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
