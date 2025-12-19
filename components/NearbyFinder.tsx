"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Input } from "./ui";

type Place = {
  name: string;
  kind: "pharmacy" | "doctor" | "hospital" | "clinic";
  address?: string;
  lat: number;
  lon: number;
};

function formatDistanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

export default function NearbyFinder() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [kind, setKind] = useState<"pharmacy" | "doctor">("pharmacy");
  const [places, setPlaces] = useState<Place[]>([]);
  const [status, setStatus] = useState<string>("");

  const sortedPlaces = useMemo(() => {
    if (!coords) return places;
    return [...places].sort((p1, p2) => formatDistanceKm(coords, p1) - formatDistanceKm(coords, p2));
  }, [places, coords]);

  async function locate() {
    setStatus("Requesting location permission…");
    setPlaces([]);
    if (!navigator.geolocation) {
      setStatus("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setStatus("Location acquired. You can now search nearby services.");
      },
      (err) => {
        setStatus(`Location error: ${err.message}. You can still search by entering coordinates below.`);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  async function search() {
    if (!coords) {
      setStatus("Please allow location access first (or enter coordinates).");
      return;
    }
    setStatus("Searching nearby services…");
    setPlaces([]);
    try {
      const res = await fetch(
        `/api/nearby?kind=${encodeURIComponent(kind)}&lat=${coords.lat}&lon=${coords.lon}&radius_km=${radiusKm}`,
        { method: "GET" }
      );
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { places: Place[] };
      setPlaces(data.places ?? []);
      setStatus(data.places?.length ? `Found ${data.places.length} place(s).` : "No results found in that radius.");
    } catch (e: any) {
      setStatus(`Search failed: ${e?.message ?? String(e)}`);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Find Nearby Doctors & Pharmacies"
        subtitle="Uses your browser location and OpenStreetMap data. No account required."
      />
      <CardBody>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2 items-center">
            <Button onClick={locate} variant="secondary">
              Use my location
            </Button>
            <Badge>{status || "Ready"}</Badge>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 p-3">
              <label className="text-xs font-medium text-slate-700">Type</label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as any)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="pharmacy">Pharmacy</option>
                <option value="doctor">Doctor / Clinic / Hospital</option>
              </select>
            </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <label className="text-xs font-medium text-slate-700">Radius (km)</label>
              <Input
                className="mt-2"
                type="number"
                min={1}
                max={50}
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
              />
            </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <label className="text-xs font-medium text-slate-700">Coordinates (optional override)</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Input
                  placeholder="Lat"
                  value={coords?.lat ?? ""}
                  onChange={(e) => setCoords((c) => ({ lat: Number(e.target.value), lon: c?.lon ?? 0 }))}
                />
                <Input
                  placeholder="Lon"
                  value={coords?.lon ?? ""}
                  onChange={(e) => setCoords((c) => ({ lat: c?.lat ?? 0, lon: Number(e.target.value) }))}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={search}>Search</Button>
            <p className="text-xs text-slate-600">Tip: increase radius if you are in a rural area.</p>
          </div>

          <div className="space-y-2">
            {sortedPlaces.map((p, idx) => (
              <div key={`${p.name}-${idx}`} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{p.name || "Unnamed place"}</div>
                    <div className="mt-1 text-xs text-slate-600">
                      {p.address ?? "Address not available"} •{" "}
                      {coords ? `${formatDistanceKm(coords, p).toFixed(2)} km` : "distance unknown"}
                    </div>
                  </div>
                  <a
                    className="text-sm underline underline-offset-4 text-slate-700 hover:text-slate-900"
                    target="_blank"
                    rel="noreferrer"
                    href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=18/${p.lat}/${p.lon}`}
                  >
                    View map
                  </a>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500">
            Data is provided by OpenStreetMap contributors. Availability/accuracy may vary by location.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
