import type { ScrapValuationResult } from "@/types/types";

const numberFormat = new Intl.NumberFormat("en-GB");
const monthFormat = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" });

function knownValue(value?: string) {
  const text = value?.trim();
  return text && text.toLowerCase() !== "unknown" ? text : undefined;
}

function formatDate(value?: string) {
  const text = knownValue(value);
  if (!text || !/^\d{4}-\d{2}(-\d{2})?$/.test(text)) return text;

  const hasDay = text.length === 10;
  const date = new Date(`${text}${hasDay ? "" : "-01"}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return text;

  return (hasDay ? dateFormat : monthFormat).format(date);
}

export default function ScrapVehicleDetails({ valuation }: { valuation: ScrapValuationResult }) {
  const details = valuation.vehicleDetails;
  const engineCapacity = details?.engineCapacityCc
    ? `${numberFormat.format(details.engineCapacityCc)} cc`
    : knownValue(valuation.engineSize);

  const detailsToShow = [
    { label: "Engine capacity", value: engineCapacity },
    { label: "Fuel type", value: knownValue(valuation.fuelType) },
    { label: "Colour", value: knownValue(valuation.colour) },
    { label: "Year of manufacture", value: details?.yearOfManufacture },
    { label: "First registered", value: formatDate(details?.firstRegistered) },
    { label: "Odometer", value: knownValue(valuation.mileage) },
    { label: "Wheel plan", value: knownValue(details?.wheelPlan) },
    { label: "Type approval", value: knownValue(details?.typeApproval) },
    { label: "CO₂ emissions", value: details?.co2Emissions === undefined ? undefined : `${numberFormat.format(details.co2Emissions)} g/km` },
    { label: "Euro emissions standard", value: knownValue(details?.euroStatus) },
    { label: "Revenue weight", value: details?.revenueWeightKg ? `${numberFormat.format(details.revenueWeightKg)} kg` : undefined },
    { label: "Tax status", value: knownValue(details?.taxStatus) },
    { label: "Tax due", value: formatDate(details?.taxDueDate) },
    { label: "Last V5C issued", value: formatDate(details?.dateOfLastV5CIssued) },
    { label: "Scrap marker", value: details?.markedAsScrapped ? "Marked as scrapped" : undefined },
    { label: "Export marker", value: details?.markedForExport ? "Marked for export" : undefined },
  ].filter(({ value }) => value !== undefined);

  const combustionFuel = /petrol|diesel|hybrid|heavy oil|gas|lpg|cng/i.test(valuation.fuelType);
  const electricDrive = /electric|hybrid/i.test(valuation.fuelType);
  const partsToCheck = [
    { name: "Engine and gearbox", parts: "Engine assembly, transmission and starter motor", show: Boolean(engineCapacity) || combustionFuel },
    { name: "Exhaust and emissions", parts: "Exhaust sections and catalytic converter", show: combustionFuel },
    { name: "Electric drive", parts: "Traction battery, drive motor and inverter", show: electricDrive },
    { name: "Wheels and tyres", parts: "Road wheels, tyres and any spare wheel", show: true },
    { name: "Body and lights", parts: "Doors, bonnet, bumpers and light assemblies", show: true },
    { name: "Electrical parts", parts: "12V battery, wiring and control modules", show: true },
  ];

  return (
    <div className="space-y-4">
      {detailsToShow.length > 0 && (
        <section className="min-w-0 space-y-3 rounded-xl border border-white/10 bg-slate-900/40 p-4 sm:p-5">
          <h4 className="text-sm font-bold text-white">Vehicle details</h4>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            {detailsToShow.map(({ label, value }) => (
              <div key={label} className="min-w-0 space-y-0.5">
                <dt className="text-xs text-slate-400">{label}</dt>
                <dd className="wrap-anywhere text-sm font-semibold text-slate-100">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="min-w-0 space-y-3 rounded-xl border border-white/10 bg-slate-900/40 p-4 sm:p-5">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white">Parts to check before collection</h4>
          <p className="text-xs leading-relaxed text-slate-400">Tell us which of these parts are missing or have been removed when you arrange pickup.</p>
        </div>
        <ul className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          {partsToCheck.filter(({ show }) => show).map(({ name, parts }) => (
            <li key={name} className="min-w-0 space-y-0.5 rounded-lg border border-white/5 bg-slate-950/45 px-3 py-2">
              <p className="text-xs font-semibold text-slate-100">{name}</p>
              <p className="text-xs leading-relaxed text-slate-400">{parts}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
