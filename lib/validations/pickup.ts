import { z } from 'zod';

export const pickupRequestSchema = z.object({
  customerName: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters.' })
    .max(50, { message: 'Name must not exceed 50 characters.' }),
  email: z
    .string()
    .email({ message: 'Please enter a valid email address.' }),
  phone: z
    .string()
    .min(10, { message: 'Phone number must be at least 10 digits.' })
    .max(15, { message: 'Phone number must not exceed 15 digits.' })
    .regex(/^[+]?[0-9\s-]+$/, { message: 'Please enter a valid phone number.' }),
  address: z
    .string()
    .min(8, { message: 'Address must be at least 8 characters.' })
    .max(150, { message: 'Address must not exceed 150 characters.' }),
  pickupDate: z
    .string()
    .min(1, { message: 'Please select a pickup date.' }),
  pickupTimeSlot: z
    .string()
    .min(1, { message: 'Please select a preferred time slot.' }),
  serviceType: z
    .string()
    .min(1, { message: 'Please select a service type.' }),
  estimatedWeight: z
    .string()
    .min(1, { message: 'Please select an estimated laundry weight.' }),
  specialInstructions: z
    .string()
    .max(500, { message: 'Special instructions must not exceed 500 characters.' })
    .optional(),
});

export type PickupRequestInput = z.infer<typeof pickupRequestSchema>;
