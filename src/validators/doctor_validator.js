// validators/doctor_validator.js
import { z } from "zod";

// Validation for creating a new doctor (admin creates)
export const createDoctorValidation = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    otherNames: z.string().optional().nullable(),
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    phoneNumber: z.string().optional().nullable(),
    specialty: z.string().optional().nullable(),
    yearsOfExperience: z.number().int().min(0).optional().nullable(),
    dateOfBirth: z.string().optional().nullable(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
    bio: z.string().optional().nullable()
});

// Validation for updating doctor profile (doctor updates themselves)
export const doctorInfoValidation = z.object({
    phoneNumber: z.string().optional().nullable(),
    specialty: z.string().optional().nullable(),
    yearsOfExperience: z.number().int().min(0).optional().nullable(),
    dateOfBirth: z.string().optional().nullable(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
    bio: z.string().optional().nullable()
});