'use client';
import { FolderSimpleIcon, ClipboardTextIcon, FileIcon, CheckIcon } from '@phosphor-icons/react';
import { useState, useEffect, useRef, MouseEvent } from 'react';
import { codeToHtml } from 'shiki';
import type { BundledLanguage, BundledTheme } from 'shiki';

type Props = {
  children: string;
  lang?: BundledLanguage;
  filename?: string;
};

const theme = 'material-theme' as BundledTheme;

export default function Code({ children, lang = 'javascript', filename }: Props) {
  const [html, setHtml] = useState('');
  const [isStuck, setIsStuck] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  const copyCode = (e: MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    button.classList.add('clicked');
    navigator.clipboard.writeText(children);
    setTimeout(() => button.classList.remove('clicked'), 500);
  };

  useEffect(() => {
    codeToHtml(children, { lang, theme }).then((result) => {
      setHtml(result);
    });
  }, [children, lang]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStuck(entry.intersectionRatio < 1);
      },
      { threshold: [1], rootMargin: '-1px 0px 0px 0px' }
    );

    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <div className='bg-base-100/30 rounded-lg'>
      <div
        ref={headerRef}
        className={`sticky top-0 flex overflow-hidden justify-between items-center px-4 py-1.5 pb-1 border-b border-white/25 transition-all
          ${isStuck
            ? 'bg-base-100/80 rounded-none'
            : 'bg-base-100/30 rounded-t-lg'
          }`}
      >
        {filename &&
          <div className="text-[0.70rem] sm:text-xs font-medium font-mono">
            {filename.split('/').map((item, i, arr) => (
              <span key={i} className='inline-flex justify-center items-center'>
                <span
                  className={`inline-flex justify-center items-center gap-1
                    ${i === arr.length - 1
                      ? 'text-gray-100 '
                      : 'text-gray-500 hover:text-gray-300 transition-colors'
                    }`}
                >
                  {i < arr.length - 1 ? (
                    <FolderSimpleIcon size={15} weight='duotone' className='inline-block' />
                  ) : (
                    <FileIcon size={15} weight='bold' className='inline-block' />
                  )}
                  {item}
                </span>
                {i < arr.length - 1 && (
                  <span className="mx-1 text-gray-600">/</span>
                )}
              </span>
            ))}
          </div>
        }
        <button
          onClick={copyCode}
          className="text-white cursor-pointer p-1 rounded-lg hover:bg-base-content/20 transition-colors group"
        >
          <ClipboardTextIcon size={17} weight='bold' className="group-[.clicked]:hidden" />
          <CheckIcon size={17} weight='bold' className="hidden group-[.clicked]:block" />
        </button>
      </div>
      {html ? (
        <div
          className="scrollbar overflow-hidden w-full rounded text-sm [&>pre]:overflow-x-auto [&>pre]:bg-transparent! [&>pre]:py-3
        [&>pre]:pl-4 [&>pre]:pr-5 [&>pre]:leading-snug [&_code]:block [&_code]:w-fit [&_code]:min-w-full
        sm:max-w-[500px] lg:max-w-none **:select-auto
        "
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className='w-full h-96 animate-pulse bg-base-100/10'></div>
      )}
    </div>
  );
}
