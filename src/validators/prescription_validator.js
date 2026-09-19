import z from "zod";

const prescriptionValidator = z.object({
    patientId: z.coerce.number().int().positive(),
    medications: z.array(z.string()).min(1),
    instructions: z.string().max(200).optional()
});

const updatePrescriptionValidator = z.object({
    medications: z.array(z.string()).min(1).optional(),
    instructions: z.string().max(200).optional()
});

export { prescriptionValidator, updatePrescriptionValidator };