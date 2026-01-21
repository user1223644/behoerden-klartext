"use client";

/**
 * Display extracted data from letter.
 */

import { ExtractedData } from "@/types";
import { ReactNode } from "react";
import { Coins, Calendar, Clock, FileText, Building2 } from "@/components/icons";

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
      <div className="p-4 bg-bg-secondary rounded-xl text-center text-text-secondary border border-border-color">
        Keine spezifischen Daten extrahiert.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-text-primary">Extrahierte Daten</h3>

      <div className="grid gap-3 md:grid-cols-2">
        {/* Amounts */}
        {data.amounts.length > 0 && (
          <DataCard
            icon={<Coins className="w-5 h-5 text-primary-orange" aria-hidden="true" />}
            label="Beträge"
            items={data.amounts.map((a) => a.formatted)}
          />
        )}

        {/* Dates */}
        {data.dates.length > 0 && (
          <DataCard 
            icon={<Calendar className="w-5 h-5 text-primary-orange" aria-hidden="true" />} 
            label="Daten" 
            items={data.dates} 
          />
        )}

        {/* Deadline */}
        {data.deadlineDays !== undefined && (
          <DataCard
            icon={<Clock className="w-5 h-5 text-yellow-500" aria-hidden="true" />}
            label="Frist"
            items={[`${data.deadlineDays} Tage`]}
            highlight
          />
        )}

        {/* References */}
        {data.references.length > 0 && (
          <DataCard 
            icon={<FileText className="w-5 h-5 text-primary-orange" aria-hidden="true" />} 
            label="Aktenzeichen" 
            items={data.references} 
          />
        )}

        {/* IBANs */}
        {data.ibans.length > 0 && (
          <DataCard 
            icon={<Building2 className="w-5 h-5 text-primary-orange" aria-hidden="true" />} 
            label="IBAN" 
            items={data.ibans} 
          />
        )}
      </div>
    </div>
  );
}

interface DataCardProps {
  icon: ReactNode;
  label: string;
  items: string[];
  highlight?: boolean;
}

function DataCard({ icon, label, items, highlight = false }: DataCardProps) {
  return (
    <div
      className={`
        p-4 rounded-xl border
        ${highlight 
          ? "bg-yellow-500/10 border-yellow-500/50" 
          : "bg-bg-secondary border-border-color"}
      `}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm font-medium text-text-secondary">{label}</span>
      </div>
      <div className="space-y-1">
        {items.map((item, i) => (
          <p
            key={i}
            className={`font-mono ${highlight ? "text-yellow-500" : "text-text-primary"}`}
          >
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}
