import { Construction } from 'lucide-react';
import { Card } from '../shared/ui';

export function ComingSoon({ title, description, scope }: { title: string; description: string; scope: string[] }) {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <Card className="max-w-lg !p-6 text-center">
        <Construction className="mx-auto mb-3 text-neutral-400" size={28} />
        <h1 className="mb-2 text-[18px] font-bold">{title}</h1>
        <p className="mb-4 text-[14px] text-neutral-500 dark:text-neutral-400">{description}</p>
        <div className="rounded-lg bg-neutral-50 p-3 text-left dark:bg-neutral-900/40">
          <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-neutral-400">Planned scope</p>
          <ul className="space-y-1 text-[13px] text-neutral-600 dark:text-neutral-300">
            {scope.map((s, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="text-neutral-400">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-3 text-[12px] text-neutral-400">See ARCHITECTURE.md for the build plan for this page.</p>
      </Card>
    </div>
  );
}
