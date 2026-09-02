"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Plus,
  Building,
  Home,
  CheckCircle2,
  Trash2,
  Edit2,
  Sparkles,
  ShieldCheck,
  X,
  Route as RouteIcon,
  Navigation,
  ExternalLink,
} from "lucide-react";

interface Route {
  id: string;
  code: string;
  name: string;
  district?: string | null;
  area?: string | null;
}

interface CustomerAddress {
  id: string;
  label?: string | null;
  address: string;
  city?: string | null;
  district?: string | null;
  postalCode?: string | null;
  routeId?: string | null;
  route?: Route | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  isPrimary: boolean;
}

interface CustomerAddressesClientProps {
  companyCode: string;
  initialAddresses: CustomerAddress[];
  availableRoutes?: Route[];
}

export default function CustomerAddressesClient({
  companyCode,
  initialAddresses,
  availableRoutes = [],
}: CustomerAddressesClientProps) {
  const [addresses, setAddresses] = useState<CustomerAddress[]>(initialAddresses);
  const [routes, setRoutes] = useState<Route[]>(availableRoutes);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [label, setLabel] = useState("Home");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [routeId, setRouteId] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  // Fetch routes dynamically if initial list is empty
  useEffect(() => {
    if (routes.length === 0) {
      fetch(`/api/c/${companyCode}/customer/addresses`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.routes) && data.routes.length > 0) {
            setRoutes(data.routes);
          }
        })
        .catch((err) => console.error("Error fetching routes:", err));
    }
  }, [companyCode, routes.length]);

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatusMsg("Geolocation is not supported by your browser");
      return;
    }

    setIsLocatingGPS(true);
    setGpsStatusMsg("Capturing live GPS location coordinates...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(7));
        setLongitude(pos.coords.longitude.toFixed(7));
        setIsLocatingGPS(false);
        setGpsStatusMsg("📍 Live GPS location captured successfully!");
        setTimeout(() => setGpsStatusMsg(""), 4000);
      },
      (err) => {
        setIsLocatingGPS(false);
        setGpsStatusMsg(`Failed to capture GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const openNewModal = () => {
    setEditingAddress(null);
    setLabel("Home");
    setAddressLine("");
    setCity("");
    setDistrict("");
    setPostalCode("");
    setRouteId("");
    setLatitude("");
    setLongitude("");
    setGpsStatusMsg("");
    setIsPrimary(addresses.length === 0);
    setError("");
    setShowModal(true);
  };

  const openEditModal = (addr: CustomerAddress) => {
    setEditingAddress(addr);
    setLabel(addr.label || "Home");
    setAddressLine(addr.address);
    setCity(addr.city || "");
    setDistrict(addr.district || "");
    setPostalCode(addr.postalCode || "");
    setRouteId(addr.routeId || "");
    setLatitude(addr.latitude !== undefined && addr.latitude !== null ? String(addr.latitude) : "");
    setLongitude(addr.longitude !== undefined && addr.longitude !== null ? String(addr.longitude) : "");
    setGpsStatusMsg("");
    setIsPrimary(addr.isPrimary);
    setError("");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine.trim()) {
      setError("Please enter address details.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (editingAddress) {
        const res = await fetch(`/api/c/${companyCode}/customer/addresses`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingAddress.id,
            label,
            address: addressLine,
            city,
            district,
            postalCode,
            routeId: routeId || null,
            latitude: latitude || null,
            longitude: longitude || null,
            isPrimary,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Failed to update address.");

        setAddresses((prev) =>
          prev.map((a) => {
            if (a.id === editingAddress.id) return data.address;
            if (isPrimary) return { ...a, isPrimary: false };
            return a;
          })
        );
      } else {
        const res = await fetch(`/api/c/${companyCode}/customer/addresses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label,
            address: addressLine,
            city,
            district,
            postalCode,
            routeId: routeId || null,
            latitude: latitude || null,
            longitude: longitude || null,
            isPrimary,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Failed to save address.");

        if (isPrimary) {
          setAddresses((prev) => [data.address, ...prev.map((a) => ({ ...a, isPrimary: false }))]);
        } else {
          setAddresses((prev) => [...prev, data.address]);
        }
      }

      setShowModal(false);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const res = await fetch(`/api/c/${companyCode}/customer/addresses?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleSetDefault = async (addr: CustomerAddress) => {
    try {
      const res = await fetch(`/api/c/${companyCode}/customer/addresses`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: addr.id, isPrimary: true }),
      });
      if (res.ok) {
        setAddresses((prev) =>
          prev.map((a) => ({ ...a, isPrimary: a.id === addr.id }))
        );
      }
    } catch (err) {
      console.error("Set default error:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-600" />
            <span>Delivery & Pickup Addresses</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your saved delivery locations, capture live GPS coordinates, and select delivery routes.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="h-10 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-2 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Address</span>
        </button>
      </div>

      {/* Addresses Grid */}
      {addresses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No saved addresses yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Add your home, office, or business location with live GPS to schedule doorstep laundry pickups.
          </p>
          <button
            onClick={openNewModal}
            className="mt-4 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition"
          >
            + Add First Address
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white rounded-2xl p-5 border transition flex flex-col justify-between space-y-4 shadow-sm ${
                addr.isPrimary
                  ? "border-purple-500 ring-2 ring-purple-500/10"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                    {addr.label === "Home" ? (
                      <Home className="w-3.5 h-3.5 text-purple-600" />
                    ) : (
                      <Building className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    {addr.label || "Address"}
                  </span>

                  {addr.isPrimary ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Default
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(addr)}
                      className="text-[11px] font-semibold text-slate-400 hover:text-purple-600 transition"
                    >
                      Set as Default
                    </button>
                  )}
                </div>

                <p className="text-xs font-medium text-slate-800 leading-relaxed">
                  {addr.address}
                </p>

                {(addr.city || addr.district || addr.postalCode) && (
                  <p className="text-[11px] text-slate-500">
                    {[addr.city, addr.district, addr.postalCode].filter(Boolean).join(", ")}
                  </p>
                )}

                {/* Selected Route Badge */}
                {addr.route && (
                  <div className="text-[11px] font-bold text-purple-800 bg-purple-50 px-2.5 py-1.5 rounded-xl border border-purple-200/80 inline-flex items-center gap-1.5 w-full">
                    <Navigation className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span className="truncate">
                      Route: <strong>{addr.route.name}</strong> [{addr.route.code}]
                    </span>
                  </div>
                )}

                {/* Saved GPS Coordinates Badge */}
                {addr.latitude && addr.longitude && (
                  <div className="text-[11px] font-bold text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 flex items-center justify-between w-full">
                    <span className="font-mono text-[10px] truncate">
                      📍 GPS: {Number(addr.latitude).toFixed(5)}, {Number(addr.longitude).toFixed(5)}
                    </span>
                    <a
                      href={`https://maps.google.com/?q=${addr.latitude},${addr.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-600 font-bold hover:underline text-[10px] inline-flex items-center gap-0.5 shrink-0"
                    >
                      <span>Map</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => openEditModal(addr)}
                  className="text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>

                <button
                  onClick={() => handleDelete(addr.id)}
                  className="text-slate-400 hover:text-rose-600 font-semibold flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-600" />
                <span>{editingAddress ? "Edit Delivery Address" : "Add New Delivery Address"}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Address Label
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Home", "Office", "Hotel"].map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLabel(l)}
                      className={`py-2 rounded-xl border text-xs font-bold transition ${
                        label === l
                          ? "bg-purple-600 border-purple-600 text-white"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Full Delivery Address *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Street address, building name, apartment or suite number..."
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-purple-600 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City / Area</label>
                  <input
                    type="text"
                    placeholder="e.g. Colombo 03"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-purple-600 transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">District / Postal Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 00300"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-purple-600 transition"
                  />
                </div>
              </div>

              {/* LIVE GPS LOCATION CAPTURE BOX */}
              <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Navigation className="w-4 h-4 text-purple-600" />
                    <span>Live GPS Location</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleCaptureGPS}
                    disabled={isLocatingGPS}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${isLocatingGPS ? "animate-spin" : ""}`} />
                    <span>{isLocatingGPS ? "Locating..." : "Capture Live Location"}</span>
                  </button>
                </div>

                {gpsStatusMsg && (
                  <p className="text-[11px] font-semibold text-purple-800 bg-white/80 p-2 rounded-lg border border-purple-200">
                    {gpsStatusMsg}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="block font-bold text-slate-600 mb-0.5">GPS Latitude</label>
                    <input
                      type="text"
                      placeholder="e.g. 6.9270786"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-[11px] outline-none focus:border-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-0.5">GPS Longitude</label>
                    <input
                      type="text"
                      placeholder="e.g. 79.8612430"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-[11px] outline-none focus:border-purple-600"
                    />
                  </div>
                </div>

                {latitude && longitude && (
                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <a
                      href={`https://maps.google.com/?q=${latitude},${longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>📍 Open in Google Maps ↗</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Admin Created Routes Dropdown */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <RouteIcon className="w-3.5 h-3.5 text-purple-600" />
                    <span>Select Admin Route (Delivery Beat)</span>
                  </span>
                  <span className="text-[10px] font-semibold text-purple-600">Admin Managed</span>
                </label>
                <select
                  value={routeId}
                  onChange={(e) => setRouteId(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-purple-600 font-semibold transition"
                >
                  <option value="">
                    {routes.length > 0
                      ? "-- Select Route (Optional) --"
                      : "-- No Admin Routes Available --"}
                  </option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} [{r.code}]{r.district ? ` - ${r.district}` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Choose the delivery route assigned by your laundry provider for faster scheduling.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="font-semibold text-slate-700">Set as my default pickup & delivery address</span>
              </label>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
