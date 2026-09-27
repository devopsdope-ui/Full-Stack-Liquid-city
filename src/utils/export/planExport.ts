/**
 * Export utilities for Liquid City plans
 */
import type { OperationalPlan, GateAllocation, ZoneCongestionEstimate, Bottleneck, ResourceDemand } from '../../types';

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function esc(v: string | number | undefined | null): string {
  const s = String(v ?? '');
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function toCsv(headers: string[], rows: (string | number | undefined | null)[][]): string {
  return [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\r\n');
}

function download(content: string, filename: string, mime = 'text/csv') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Plan exports ─────────────────────────────────────────────────────────────

export function exportGateAllocationCsv(plan: OperationalPlan) {
  const headers = ['Gate', 'Share %', 'Expected Attendance', 'Basis'];
  const rows = plan.gate_allocation.map((g: GateAllocation) => [
    g.name, g.share_percentage, g.expected_attendance, g.basis,
  ]);
  download(toCsv(headers, rows), 'gate_allocation.csv');
}

export function exportZoneCongestionCsv(plan: OperationalPlan) {
  const headers = ['Zone', 'Activity', 'Expected', 'Capacity', 'Occupancy %', 'Status'];
  const rows = plan.zone_congestion.map((z: ZoneCongestionEstimate) => [
    z.zone, z.activity ?? '', z.expected_attendance ?? '', z.capacity ?? '',
    z.projected_occupancy_percentage ?? '', z.status,
  ]);
  download(toCsv(headers, rows), 'zone_congestion.csv');
}

export function exportPlanJson(plan: OperationalPlan) {
  download(JSON.stringify(plan, null, 2), 'liquid_city_plan.json', 'application/json');
}

export async function exportPlanXlsx(plan: OperationalPlan) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  if (plan.gate_allocation.length > 0) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        plan.gate_allocation.map((g: GateAllocation) => ({
          Gate: g.name, 'Share %': g.share_percentage,
          'Expected Attendance': g.expected_attendance, Basis: g.basis,
        }))
      ),
      'Gate Allocation'
    );
  }

  if (plan.zone_congestion.length > 0) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        plan.zone_congestion.map((z: ZoneCongestionEstimate) => ({
          Zone: z.zone, Activity: z.activity ?? '', Status: z.status,
          'Expected Attendance': z.expected_attendance ?? '',
          Capacity: z.capacity ?? '', 'Occupancy %': z.projected_occupancy_percentage ?? '',
        }))
      ),
      'Zone Congestion'
    );
  }

  if (plan.bottlenecks.length > 0) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        plan.bottlenecks.map((b: Bottleneck) => ({
          'Zone/Gate': b.zone_or_gate, Reason: b.reason, Severity: b.severity,
        }))
      ),
      'Bottlenecks'
    );
  }

  if (plan.resource_demand.length > 0) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        plan.resource_demand.map((r: ResourceDemand) => ({
          Resource: r.resource, 'Estimated Demand': r.estimated_demand ?? '', Note: r.note ?? '',
        }))
      ),
      'Resources'
    );
  }

  XLSX.writeFile(wb, 'liquid_city_event_plan.xlsx');
}

export function exportTableCsv<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
) {
  if (data.length === 0) return;
  const keys = columns ? columns.map((c) => c.key) : (Object.keys(data[0]) as (keyof T)[]);
  const headers = columns ? columns.map((c) => c.label) : keys.map(String);
  const rows = data.map((item) => keys.map((k) => item[k] as string | number | undefined));
  download(toCsv(headers, rows), filename);
}
