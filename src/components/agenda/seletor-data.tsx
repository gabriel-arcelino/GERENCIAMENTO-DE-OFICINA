"use client";

import { useRouter } from "next/navigation";

interface SeletorDataProps {
  defaultValue: string;
}

export function SeletorData({ defaultValue }: SeletorDataProps) {
  const router = useRouter();

  return (
    <input
      type="date"
      defaultValue={defaultValue}
      onChange={(e) => {
        if (e.target.value) {
          router.push(`/agenda?data=${e.target.value}`);
        }
      }}
      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      aria-label="Selecionar data"
    />
  );
}
