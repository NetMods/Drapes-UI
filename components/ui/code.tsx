'use client';
import { cn } from '@/lib/utils';
import { FolderSimpleIcon, ClipboardTextIcon, FileIcon, CheckIcon, LinkIcon } from '@phosphor-icons/react';
import { MouseEvent, useEffect, useState } from "react"
import { BundledLanguage, codeToHtml } from 'shiki';

type Props = {
  htmlCode: string;
  code: string;
  filename?: string;
  dynamic?: string;
  language?: string;
  type?: string
  id?: number
  raw?: boolean
};

export default function Code({ htmlCode, code, filename, dynamic, language, type, id, raw }: Props) {
  const [html, setHtml] = useState<string>(htmlCode)

  useEffect(() => {
    if (dynamic) {
      codeToHtml(dynamic, { lang: language as BundledLanguage, theme: 'vesper' })
        .then((result) => setHtml(result));
    } else {
      setHtml(htmlCode)
    }
  }, [htmlCode, dynamic])

  const copyData = (e: MouseEvent<HTMLButtonElement>, raw?: boolean) => {
    const button = e.currentTarget;
    button.classList.add('clicked');
    if (!raw && raw === undefined) {
      navigator.clipboard.writeText(code)
    } else {
      const rawURL = `http://localhost:3000/api/v1/raw?id=${id}&type=${type}`
      navigator.clipboard.writeText(rawURL)
    }
    setTimeout(() => button.classList.remove('clicked'), 500);
  };

  return (
    <div className='bg-base-100/30 rounded-lg'>
      <div
        className={cn('flex overflow-hidden justify-between items-center px-2 py-1.5 pb-1 border-b',
          'border-white/15 transition-all bg-base-100/10 backdrop-blur-3xl rounded-t-lg')}
      >
        {filename &&
          <div className="text-[0.70rem] sm:text-xs font-medium font-mono">
            {filename.split('/').map((item, i, arr) => (
              <span key={i} className='inline-flex justify-center items-center'>
                <span
                  className={cn(
                    'inline-flex justify-center items-center gap-1',
                    i === arr.length - 1 ? 'text-gray-100 ' : 'text-gray-500 hover:text-gray-300 transition-colors'
                  )}>
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
        <div className='flex justify-center items-center gap-0.5'>
          {
            raw &&
            <button
              onClick={(event: MouseEvent<HTMLButtonElement>) => {
                copyData(event, true)
              }}
              className="text-white cursor-pointer p-1 rounded-lg hover:bg-base-content/20 transition-colors group"
            >
              <LinkIcon size={17} weight='bold' className="group-[.clicked]:hidden" />
              <CheckIcon size={17} weight='bold' className="hidden group-[.clicked]:block" />
            </button>
          }
          <button
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
              copyData(event)
            }}
            className="text-white cursor-pointer p-1 rounded-lg hover:bg-base-content/20 transition-colors group"
          >
            <ClipboardTextIcon size={17} weight='bold' className="group-[.clicked]:hidden" />
            <CheckIcon size={17} weight='bold' className="hidden group-[.clicked]:block" />
          </button>
        </div>
      </div>
      {html ? (
        <div
          className={cn(
            'scrollbar overflow-hidden w-full rounded text-sm [&>pre]:overflow-x-auto [&>pre]:bg-transparent! [&>pre]:py-3',
            '[&>pre]:pl-4 [&>pre]:pr-5 [&>pre]:leading-snug [&_code]:block [&_code]:w-fit [&_code]:min-w-full',
            'sm:max-w-[500px] lg:max-w-none **:select-auto [&_code]:font-code outline-0 focus:outline-0'
          )}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className='w-full h-96 animate-pulse bg-base-100/10'></div>
      )}
    </div>
  );
}
