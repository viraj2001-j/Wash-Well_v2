// "use client";

// import { FormEvent, useState } from "react";
// import { useRouter } from "next/navigation";

// export default function NewOrganizationForm() {
//   const router = useRouter();

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const [form, setForm] = useState({
//     name: "",
//     code: "",
//     email: "",
//     phone: "",
//     address: "",
//     city: "",
//     country: "Sri Lanka",
//   });

//   function updateField(
//     field: keyof typeof form,
//     value: string,
//   ) {
//     setForm((current) => ({
//       ...current,
//       [field]: value,
//     }));
//   }

//   async function handleSubmit(
//     event: FormEvent<HTMLFormElement>,
//   ) {
//     event.preventDefault();

//     setLoading(true);
//     setError("");

//     try {
//       const response = await fetch(
//         "/api/super-admin/organizations",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(form),
//         },
//       );

//       const data = await response.json();

//       if (!response.ok) {
//         setError(
//           data.error ||
//             "Failed to create organization.",
//         );

//         return;
//       }

//       router.push("/super-admin/organizations");
//       router.refresh();
//     } catch (error) {
//       console.error(error);

//       setError(
//         "Something went wrong. Please try again.",
//       );
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <main className="min-h-screen bg-gray-100 p-8">
//       <div className="mx-auto max-w-3xl">

//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900">
//             Create Organization
//           </h1>

//           <p className="mt-2 text-gray-600">
//             Create a new organization on the platform.
//           </p>
//         </div>

//         <form
//           onSubmit={handleSubmit}
//           className="rounded-xl bg-white p-8 shadow"
//         >
//           {error && (
//             <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
//               {error}
//             </div>
//           )}

//           <div className="grid gap-6 md:grid-cols-2">

//             {/* Organization Name */}

//             <div className="md:col-span-2">
//               <label className="mb-2 block text-sm font-medium text-gray-700">
//                 Organization Name *
//               </label>

//               <input
//                 required
//                 value={form.name}
//                 onChange={(event) =>
//                   updateField(
//                     "name",
//                     event.target.value,
//                   )
//                 }
//                 className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
//                 placeholder="Wash & Well"
//               />
//             </div>

//             {/* Organization Code */}

//             <div>
//               <label className="mb-2 block text-sm font-medium text-gray-700">
//                 Organization Code *
//               </label>

//               <input
//                 required
//                 value={form.code}
//                 onChange={(event) =>
//                   updateField(
//                     "code",
//                     event.target.value.toUpperCase(),
//                   )
//                 }
//                 className="w-full rounded-lg border px-4 py-3 uppercase outline-none focus:ring-2"
//                 placeholder="WASHWELL"
//               />
//             </div>

//             {/* Email */}

//             <div>
//               <label className="mb-2 block text-sm font-medium text-gray-700">
//                 Email
//               </label>

//               <input
//                 type="email"
//                 value={form.email}
//                 onChange={(event) =>
//                   updateField(
//                     "email",
//                     event.target.value,
//                   )
//                 }
//                 className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
//                 placeholder="admin@washwell.lk"
//               />
//             </div>

//             {/* Phone */}

//             <div>
//               <label className="mb-2 block text-sm font-medium text-gray-700">
//                 Phone
//               </label>

//               <input
//                 value={form.phone}
//                 onChange={(event) =>
//                   updateField(
//                     "phone",
//                     event.target.value,
//                   )
//                 }
//                 className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
//                 placeholder="0771234567"
//               />
//             </div>

//             {/* City */}

//             <div>
//               <label className="mb-2 block text-sm font-medium text-gray-700">
//                 City
//               </label>

//               <input
//                 value={form.city}
//                 onChange={(event) =>
//                   updateField(
//                     "city",
//                     event.target.value,
//                   )
//                 }
//                 className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
//                 placeholder="Kurunegala"
//               />
//             </div>

//             {/* Address */}

//             <div className="md:col-span-2">
//               <label className="mb-2 block text-sm font-medium text-gray-700">
//                 Address
//               </label>

//               <textarea
//                 value={form.address}
//                 onChange={(event) =>
//                   updateField(
//                     "address",
//                     event.target.value,
//                   )
//                 }
//                 className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
//                 rows={3}
//                 placeholder="Organization address"
//               />
//             </div>

//             {/* Country */}

//             <div>
//               <label className="mb-2 block text-sm font-medium text-gray-700">
//                 Country
//               </label>

//               <input
//                 value={form.country}
//                 onChange={(event) =>
//                   updateField(
//                     "country",
//                     event.target.value,
//                   )
//                 }
//                 className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
//               />
//             </div>

//           </div>

//           {/* Buttons */}

//           <div className="mt-8 flex justify-end gap-3">

//             <button
//               type="button"
//               disabled={loading}
//               onClick={() =>
//                 router.push(
//                   "/super-admin/organizations",
//                 )
//               }
//               className="rounded-lg border px-5 py-3 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
//             >
//               Cancel
//             </button>

//             <button
//               type="submit"
//               disabled={loading}
//               className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
//             >
//               {loading
//                 ? "Creating..."
//                 : "Create Organization"}
//             </button>

//           </div>
//         </form>
//       </div>
//     </main>
//   );
// }