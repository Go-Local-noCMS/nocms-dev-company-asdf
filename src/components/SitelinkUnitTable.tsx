"use client";

import { useEffect, useState } from "react";
import { callSitelink } from "@/lib/fms-config";

export interface SitelinkUnit {
  id: string;
  name: string | null;
  type: string | null;
  width: number | null;
  length: number | null;
  area: number | null;
  floor: number | null;
  climate: boolean;
  inside: boolean;
  power: boolean;
  alarm: boolean;
  rate: number | null;
  available: boolean;
  description: string | null;
}

interface SitelinkUnitTableProps {
  sLocationCode: string;
  reserveHref?: string;
}

function buildRentHref(unitId: string, sLocationCode: string): string {
  const qs = new URLSearchParams({ unitId, sLocationCode }).toString();
  return `/rent?${qs}`;
}

export function SitelinkUnitTable({ sLocationCode, reserveHref = "#" }: SitelinkUnitTableProps) {
  const [units, setUnits] = useState<SitelinkUnit[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "empty" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    callSitelink<{ sLocationCode: string; lngLastTimePolled: string; bReturnExcludedFromWebsiteUnits: boolean }, { Table?: unknown; RT?: Array<{ Ret_Code?: number; Ret_Msg?: string | null }> }>(
      "UnitsInformation_v3",
      {
        sLocationCode,
        lngLastTimePolled: "",
        bReturnExcludedFromWebsiteUnits: false,
      },
    )
      .then((body) => {
        if (cancelled) return;
        const retCode = body?.RT?.[0]?.Ret_Code;
        if (retCode != null && retCode !== 1) throw new Error(`SiteLink Ret_Code=${retCode}`);
        const rows = Array.isArray(body?.Table) ? (body.Table as Array<Record<string, unknown>>) : [];
        const list: SitelinkUnit[] = rows
          .filter((u) => (u as { bExcludeFromWebsite?: boolean }).bExcludeFromWebsite !== true)
          .map((u) => {
            const r = u as Record<string, unknown>;
            const w = r.dcWidth != null ? Number(r.dcWidth) : null;
            const l = r.dcLength != null ? Number(r.dcLength) : null;
            const area = r.dcArea != null ? Number(r.dcArea) : (w != null && l != null ? w * l : null);
            const rate = r.dcWebRate != null ? Number(r.dcWebRate) : (r.dcStdRate != null ? Number(r.dcStdRate) : null);
            return {
              id: r.UnitID != null ? String(r.UnitID) : (typeof r.sUnitName === "string" ? r.sUnitName : ""),
              name: typeof r.sUnitName === "string" ? r.sUnitName : null,
              type: typeof r.sTypeName === "string" ? r.sTypeName : null,
              width: Number.isFinite(w as number) ? w : null,
              length: Number.isFinite(l as number) ? l : null,
              area: Number.isFinite(area as number) ? area : null,
              floor: typeof r.iFloor === "number" ? r.iFloor : null,
              climate: r.bClimate === true,
              inside: r.bInside === true,
              power: r.bPower === true,
              alarm: r.bAlarm === true,
              rate: Number.isFinite(rate as number) ? rate : null,
              available: r.bRented !== true && r.bRentable !== false,
              description: typeof r.sUnitDesc === "string" ? r.sUnitDesc : null,
            };
          });
        setUnits(list);
        setStatus(list.length === 0 ? "empty" : "ok");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [sLocationCode]);

  if (status === "loading") {
    return <p className="text-sm text-muted">Loading units…</p>;
  }
  if (status === "error") {
    return <p className="text-sm">Could not load unit availability. Try again in a moment.</p>;
  }
  if (status === "empty") {
    return <p className="text-sm">No units currently available.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th scope="col" className="px-3 py-2">Size</th>
            <th scope="col" className="px-3 py-2">Features</th>
            <th scope="col" className="px-3 py-2">Rate</th>
            <th scope="col" className="px-3 py-2">Status</th>
            <th scope="col" className="px-3 py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {units.map((u) => (
            <tr key={u.id}>
              <td className="px-3 py-2 font-mono">
                {u.width ?? "?"}&times;{u.length ?? "?"}{u.area != null ? ` (${u.area} sq ft)` : ""}
              </td>
              <td className="px-3 py-2">
                {[u.climate ? "Climate" : null, u.inside ? "Indoor" : null, u.power ? "Power" : null, u.alarm ? "Alarm" : null].filter(Boolean).join(" · ")}
              </td>
              <td className="px-3 py-2 font-mono">{u.rate != null ? `$${u.rate.toFixed(2)}/mo` : "—"}</td>
              <td className="px-3 py-2">{u.available ? "Available" : "Waitlist"}</td>
              <td className="px-3 py-2 text-right">
                {u.available ? (
                  <span className="inline-flex gap-2">
                    <a href={reserveHref}>Reserve</a>
                    <a href={buildRentHref(u.id, sLocationCode)}>Rent</a>
                  </span>
                ) : (
                  <span>—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
