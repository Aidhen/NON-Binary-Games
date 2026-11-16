import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { BODY, HEADING } from './styles';

interface PageProps {
  title: string;
  lead: string;
  children: ReactNode;
}

/** A page of the site that is not a room: its title, one line that says what it is for, and its content. */
export function Page({ title, lead, children }: Readonly<PageProps>) {
  return (
    // mb-auto: the layout centers what it holds, and a page starts from the top instead.
    <div className="mb-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-12 pt-2 sm:gap-10 sm:px-8">
      <div className="flex flex-col gap-2">
        <h1 className={cn(HEADING, "text-4xl sm:text-5xl")}>{title}</h1>
        <p className={cn(BODY, "max-w-2xl text-base sm:text-lg")}>{lead}</p>
      </div>
      {children}
    </div>
  );
}
