import { z } from 'zod';

export const patientInfo = z.object({
    dateOfBirth : z.coerce.date().optional(),
    gender: z.string().min(2, "Name must be at least 2 characters").optional(),
    phoneNumber: z.string().trim().regex(/^\+?[\d\s-()]{10,15}$/, "Phone number must be 10-15 digits with optional +").optional(),
    currentAddress: z.string().optional(),
    emergencyContactFirstName: z.string()
    .trim()
    .min(2, "Name must be at least 2 characters").optional(),
    emergencyContactLastName: z.string()
    .trim()
    .min(2, "Name must be at least 2 characters").optional(),
    emergencyContactPhoneNumber: z.string().trim().regex(/^\+?[\d\s-()]{10,15}$/, "Phone number must be 10-15 digits with optional +").optional(),
    currentAddress: z.string().optional(),
    primaryLanguage:z.string().optional(),
    occupation: z.string().optional(),
    livingSituation: z.string().optional(),


});




  
 