import { z } from 'zod';

export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters.' })
    .max(50, { message: 'Name must not exceed 50 characters.' }),
  email: z
    .string()
    .email({ message: 'Please enter a valid email address.' }),
  subject: z
    .string()
    .min(3, { message: 'Subject must be at least 3 characters.' })
    .max(100, { message: 'Subject must not exceed 100 characters.' }),
  message: z
    .string()
    .min(10, { message: 'Message must be at least 10 characters.' })
    .max(1000, { message: 'Message must not exceed 1000 characters.' }),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
