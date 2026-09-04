import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import { Truck, MapPin, Phone, CalendarDays, UserCheck } from "lucide-react";

export default async function DriverAssignmentPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await prisma.company.findUnique({ where: { code } });
  if (!company) notFound();

  const user = await requireCompanyAccess(company.id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch ONLY active & unexpired route assignments where this driver is assigned
  const myAssignmentsRaw = await prisma.dailyRouteAssignment.findMany({
    where: {
      companyId: company.id,
      driverId: user.id,
      status: { in: ["ACTIVE", "PLANNED"] },
    },
    include: {
      route: {
        include: {
          customers: {
            where: { isActive: true },
            include: {
              customer: {
                include: {
                  addresses: true,
                },
              },
            },
          },
          customerAddresses: {
            include: {
              customer: {
                include: {
                  addresses: true,
                },
              },
            },
          },
        },
      },
      ref: true,
      driver: true,
    },
    orderBy: { workDate: "desc" },
  });

  const myAssignments = myAssignmentsRaw.filter((asg) => {
    const checkDate = asg.endDate || asg.route?.endDate || asg.workDate;
    if (!checkDate) return true;
    const d = new Date(checkDate);
    d.setHours(23, 59, 59, 999);
    return d >= today;
  });

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-sky-700 to-indigo-800 p-6 rounded-3xl text-white shadow-lg">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-200">Driver Workspace</span>
          <h1 className="text-2xl font-extrabold mt-1">My Daily Route Assignments</h1>
          <p className="text-xs text-sky-100 mt-1">
            Logged in as <strong>{user.fullName}</strong>
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-xs font-bold flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-sky-300" />
          <span>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-6">
        {myAssignments.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
              <Truck className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="text-base font-bold text-gray-800">No Active Routes Assigned</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              You currently do not have any active daily route assignments assigned to your driver account. Contact your branch manager if you require a route.
            </p>
          </div>
        ) : (
          myAssignments.map((asg) => {
            const r = asg.route;
            const customerMap = new Map();

            (r?.customers || []).forEach((rc: any) => {
              if (rc.customer) {
                customerMap.set(rc.customer.id, rc.customer);
              }
            });

            (r?.customerAddresses || []).forEach((addr: any) => {
              if (addr.customer && !customerMap.has(addr.customer.id)) {
                customerMap.set(addr.customer.id, addr.customer);
              }
            });

            const routeCustomers = Array.from(customerMap.values());

            return (
              <div key={asg.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden space-y-4 p-6">
                
                {/* Route Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
                        {r.code}
                      </span>
                      <h2 className="text-lg font-extrabold text-gray-900">{r.name}</h2>
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Assigned Driver
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                      <span>Area: <strong>{r.area || "N/A"}</strong></span>
                      <span>•</span>
                      <span>District: <strong>{r.district || "N/A"}</strong></span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <UserCheck className="w-4 h-4 text-purple-600 shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Sales Rep</p>
                      <p className="font-extrabold text-gray-800">{asg.ref?.fullName || "Unassigned"}</p>
                    </div>
                  </div>
                </div>

                {/* Target & Schedule Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-sky-50/50 p-4 rounded-2xl border border-sky-100/60 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Frequency</span>
                    <p className="font-extrabold text-gray-900 mt-0.5">{r.frequency}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Target Visits</span>
                    <p className="font-extrabold text-gray-900 mt-0.5">{r.targetCalls || routeCustomers.length} Stops</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Start Date</span>
                    <p className="font-extrabold text-gray-900 mt-0.5">{r.startDate ? new Date(r.startDate).toLocaleDateString() : new Date(asg.workDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">End Date</span>
                    <p className="font-extrabold text-gray-900 mt-0.5">{r.endDate ? new Date(r.endDate).toLocaleDateString() : "Ongoing"}</p>
                  </div>
                </div>

                {/* Assigned Shops / Customer Stops */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Assigned Shop Stops ({routeCustomers.length})
                  </h4>

                  <div className="space-y-3">
                    {routeCustomers.length === 0 ? (
                      <p className="text-xs text-gray-400 italic py-4 text-center">No customer shops linked to this route yet.</p>
                    ) : (
                      routeCustomers.map((cust: any) => {
                        const primaryAddr = cust.addresses?.find((a: any) => a.isPrimary)?.address || cust.addresses?.[0]?.address || "Address not specified";

                        return (
                          <div key={cust.id} className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 transition">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-gray-900 text-xs">{cust.name}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                                  {cust.customerType || "INDIVIDUAL"}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                <MapPin size={13} className="text-gray-400 shrink-0" /> {primaryAddr}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {cust.phone && (
                                <a
                                  href={`tel:${cust.phone}`}
                                  className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 font-bold text-xs rounded-xl flex items-center gap-1 hover:bg-gray-100 transition"
                                >
                                  <Phone size={13} /> {cust.phone}
                                </a>
                              )}
                              <Link
                                href={`/c/${code}/driver/deliveries`}
                                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1"
                              >
                                <Truck size={13} /> Deliveries
                              </Link>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
