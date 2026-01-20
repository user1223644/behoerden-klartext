"use client";

/**
 * Display extracted data from letter.
 */

import { ExtractedData } from "@/types";

interface ExtractedDataDisplayProps {
  data: ExtractedData;
}

export function ExtractedDataDisplay({ data }: ExtractedDataDisplayProps) {
  const hasData =
    data.dates.length > 0 ||
    data.amounts.length > 0 ||
    data.references.length > 0 ||
    data.ibans.length > 0 ||
    data.deadlineDays !== undefined;

  if (!hasData) {
    return (
      <div className="p-4 bg-gray-800/50 rounded-xl text-center text-gray-400">
        Keine spezifischen Daten extrahiert.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Extrahierte Daten</h3>

      <div className="grid gap-3 md:grid-cols-2">
        {/* Amounts */}
        {data.amounts.length > 0 && (
          <DataCard
            icon="💰"
            label="Beträge"
            items={data.amounts.map((a) => a.formatted)}
          />
        )}

        {/* Dates */}
        {data.dates.length > 0 && (
          <DataCard icon="📅" label="Daten" items={data.dates} />
        )}

        {/* Deadline */}
        {data.deadlineDays !== undefined && (
          <DataCard
            icon="⏰"
            label="Frist"
            items={[`${data.deadlineDays} Tage`]}
            highlight
          />
        )}

        {/* References */}
        {data.references.length > 0 && (
          <DataCard icon="📋" label="Aktenzeichen" items={data.references} />
        )}

        {/* IBANs */}
        {data.ibans.length > 0 && (
          <DataCard icon="🏦" label="IBAN" items={data.ibans} />
        )}
      </div>
    </div>
  );
}

interface DataCardProps {
  icon: string;
  label: string;
  items: string[];
  highlight?: boolean;
}

function DataCard({ icon, label, items, highlight = false }: DataCardProps) {
  return (
    <div
      className={`
        p-4 rounded-xl
        ${highlight ? "bg-yellow-500/20 border border-yellow-500/50" : "bg-gray-800/50"}
      `}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-sm font-medium text-gray-400">{label}</span>
      </div>
      <div className="space-y-1">
        {items.map((item, i) => (
          <p
            key={i}
            className={`font-mono ${highlight ? "text-yellow-300" : "text-white"}`}
          >
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}
