// import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
// import prisma from "@/lib/db";
// import Link from "next/link";

// export default async function OrganizationsPage() {
//   // 1. Instant Server-Side Protection
//   await requireSuperAdmin();

//   // 2. Fetch data directly from Prisma (safe because this is a Server Component)
//   const companies = await prisma.company.findMany({
//     orderBy: { createdAt: "desc" },
//     include: {
//       _count: { select: { branches: true } },
//     },
//   });

//   return (
//     <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
//       <div className="sm:flex sm:items-center sm:justify-between mb-8">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
//           <p className="mt-2 text-sm text-gray-700">
//             Manage all tenants and organizations registered on the platform.
//           </p>
//         </div>
//         <div className="mt-4 sm:mt-0">
//           <Link
//             href="/super-admin/organizations/new"
//             className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
//           >
//             Add Organization
//           </Link>
//         </div>
//       </div>

//       <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
//         <table className="min-w-full divide-y divide-gray-300">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Company</th>
//               <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Code (Slug)</th>
//               <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Location</th>
//               <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Branches</th>
//               <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-200 bg-white">
//             {companies.map((company) => (
//               <tr key={company.id}>
//                 <td className="whitespace-nowrap py-4 pl-4 pr-3">
//                   <div className="flex items-center">
//                     <div className="h-10 w-10 flex-shrink-0 rounded border bg-gray-50 flex items-center justify-center overflow-hidden">
//                       {company.logoUrl ? (
//                         <img src={company.logoUrl} alt={company.name} className="h-full w-full object-cover" />
//                       ) : (
//                         <span className="text-gray-400 text-xs">Logo</span>
//                       )}
//                     </div>
//                     <div className="ml-4">
//                       <div className="font-medium text-gray-900">{company.name}</div>
//                       <div className="text-gray-500 text-sm">{company.email || "No email"}</div>
//                     </div>
//                   </div>
//                 </td>
//                 <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
//                   <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
//                     {company.code}
//                   </span>
//                 </td>
//                 <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
//                   {company.city ? `${company.city}, ${company.country}` : company.country}
//                 </td>
//                 <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
//                   {company._count.branches}
//                 </td>
//                 <td className="whitespace-nowrap px-3 py-4 text-sm">
//                   {company.isActive ? (
//                     <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">Active</span>
//                   ) : (
//                     <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">Inactive</span>
//                   )}
//                 </td>
//               </tr>
//             ))}
            
//             {companies.length === 0 && (
//               <tr>
//                 <td colSpan={5} className="py-10 text-center text-sm text-gray-500">
//                   No organizations found. Click "Add Organization" to create one.
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// // }


// import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
// import prisma from "@/lib/db";
// import OrganizationsClient from "./OrganizationsDrawer";

// export default async function OrganizationsPage() {
//   // 1. Instant Server-Side Protection
//   await requireSuperAdmin();

//   // 2. Fetch all companies and their latest deactivation log
//   const rawCompanies = await prisma.company.findMany({
//     orderBy: { createdAt: "desc" },
//     include: {
//       _count: { select: { branches: true, users: true } },
//       activityLogs: {
//         where: { action: "DEACTIVATED_COMPANY" },
//         orderBy: { createdAt: "desc" },
//         take: 1, // Only get the most recent one
//       },
//     },
//   });

//   // 3. Serialize Dates and extract the reason
//   const companies = rawCompanies.map((company) => {
//     let inactiveReason = null;
    
//     // If the company is inactive, grab the reason from the latest activity log
//     if (!company.isActive && company.activityLogs.length > 0) {
//       const desc = company.activityLogs[0].description;
//       // Remove the prefix we added in the API route
//       inactiveReason = desc ? desc.replace("Status changed. Reason: ", "") : null;
//     }

//     // Remove activityLogs array from the final payload to keep it clean
//     const { activityLogs, ...companyData } = company;

//     return {
//       ...companyData,
//       createdAt: companyData.createdAt.toISOString(),
//       inactiveReason,
//     };
//   });

//   // 4. Pass to our highly interactive Client Component
//   return <OrganizationsClient initialData={companies} />;
// }


import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import prisma from "@/lib/db";
import OrganizationsClient from "./OrganizationsDrawer";

export default async function OrganizationsPage() {
  await requireSuperAdmin();

  const rawCompanies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { branches: true, users: true } },
      activityLogs: {
        where: { action: "DEACTIVATED_COMPANY" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      // THIS FETCHES THE EXISTING ADMINS FOR EACH COMPANY
      users: {
        where: {
          roles: {
            some: { role: { name: "ORG_ADMIN" } }
          }
        },
        select: { id: true, fullName: true, email: true }
      }
    },
  });

  const companies = rawCompanies.map((company) => {
    let inactiveReason = null;
    
    if (!company.isActive && company.activityLogs.length > 0) {
      const desc = company.activityLogs[0].description;
      inactiveReason = desc ? desc.replace("Status changed. Reason: ", "") : null;
    }

    const { activityLogs, ...companyData } = company;

    return {
      ...companyData,
      createdAt: companyData.createdAt.toISOString(),
      inactiveReason,
    };
  });

  return <OrganizationsClient initialData={companies} />;
}