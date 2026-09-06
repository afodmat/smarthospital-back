// validators/admin_validator.js
import { z } from 'zod';

export const adminValidator = z.object({
    firstName: z.string().trim().min(2, "First name must be at least 2 characters").max(50),
    lastName: z.string().trim().min(2, "Last name must be at least 2 characters").max(50),
    email: z.string().trim().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(['ADMIN', 'SUPER_ADMIN']).default('ADMIN'),
    phoneNumber: z.string().trim().optional().nullable(),
});