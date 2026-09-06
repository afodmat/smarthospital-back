import { z } from 'zod';

export const appointmentValidation = z.object({
    doctorId: z.coerce.number({
        required_error: "Doctor ID is required",
        invalid_type_error: "Doctor ID must be a number"
    }),


    type: z.enum([
        'in_person_visit',
        'virtual_consultation',
        'phone_consultation'
    ], {
        required_error: "Appointment type is required"
    }),

    symptoms: z.string().trim().min(1, "Symptoms / reason for visit is required"),

    additionalInfo: z.string().trim().optional(),

    
});

export const updateAppointmentValidation = z.object({
    scheduledAt: z.string().datetime().optional(),

    type: z.enum([
        'in_person_visit',
        'virtual_consultation',
        'phone_consultation'
    ]).optional(),

    symptoms: z.string().trim().optional(),

    additionalInfo: z.string().trim().optional(),

    status: z.enum([
        'pending',
        'confirmed',
        'cancelled'
    ]).optional()
});