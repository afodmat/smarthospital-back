import { prisma } from "../config/db.js";
import { prescriptionValidator ,updatePrescriptionValidator } from "../validators/prescription_validator.js";

export const createPrescriptionController = async (req, res) => {
    try {
        const role = req.user.role;
        if (role !== "DOCTOR") {
            return res.status(403).json({
                success: false,
                message: "Only doctors can create prescriptions"
            });
        }
        const result = prescriptionValidator.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid prescription data",
                errors: result.error.flatten()
            });
        }

        const doctor = await prisma.doctor.findUnique({
            where: {
                userId: req.user.id
            }
        });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor profile not found"
            });
        }

        const patient = await prisma.patient.findUnique({
            where: {
                id: result.data.patientId
            }
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        const prescription = await prisma.prescription.create({
            data: {
                doctorId: doctor.id,
                patientId: result.data.patientId,
                medications: result.data.medications,
                instructions: result.data.instructions
            }
        });

        res.status(201).json({
            success: true,
            message: "Prescription created successfully",
            data: prescription
        });
    } catch (error) {
        console.error("Error creating prescription:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const getPrescriptionsByPatientController = async (req, res) => {
    try {
        const { patientId } = req.params;
        const prescriptions = await prisma.prescription.findMany({
            where: { patientId },
            include: {
                doctor: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        res.status(200).json({
            success: true,
            message: "Prescriptions retrieved successfully",
            data: prescriptions
        });
    } catch (error) {
        console.error("Error retrieving prescriptions:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const getPrescriptionsByDoctorController = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const prescriptions = await prisma.prescription.findMany({
            where: { doctorId },
            include: {
                patient: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        res.status(200).json({
            success: true,
            message: "Prescriptions retrieved successfully",
            data: prescriptions
        });
    } catch (error) {
        console.error("Error retrieving prescriptions:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const getPrescriptionByIdController = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const prescription = await prisma.prescription.findUnique({
            where: { id },
            include: {
                patient: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                },
                doctor: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                }
            }
        });

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: "Prescription not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Prescription retrieved successfully",
            data: prescription
        });
    } catch (error) {
        console.error("Error retrieving prescription:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const updatePrescriptionController = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const result = updatePrescriptionValidator.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid input data",
                errors: result.error.issues
            });
        }

        const existingPrescription = await prisma.prescription.findUnique({
            where: { id }
        });

        if (!existingPrescription) {
            return res.status(404).json({
                success: false,
                message: "Prescription not found"
            });
        }

        const updateData = {};
        if (result.data.medications) updateData.medications = result.data.medications;
        if (result.data.instructions) updateData.instructions = result.data.instructions;

        const updatedPrescription = await prisma.prescription.update({
            where: { id },
            data: updateData
        });

        res.status(200).json({
            success: true,
            message: "Prescription updated successfully",
            data: updatedPrescription
        });
    } catch (error) {
        console.error("Error updating prescription:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const getAllPrescriptionsController = async (req, res) => {
    try {
        const prescriptions = await prisma.prescription.findMany({
            include: {
                patient: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                },
                doctor: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                }
            }
        });

        res.status(200).json({
            success: true,
            message: "Prescriptions retrieved successfully",
            data: prescriptions
        });
    } catch (error) {
        console.error("Error retrieving prescriptions:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const deletePrescriptionController = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const deletedPrescription = await prisma.prescription.update({
            where: { id },
            data: {
                deletedAt: new Date()
            }
        });

        res.status(200).json({
            success: true,
            message: "Prescription deleted successfully",
            data: deletedPrescription
        });
    } catch (error) {
        console.error("Error deleting prescription:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}; 

export const getMyPrescriptionsController = async (req, res) => {
    try {
        const userId = req.user.id;

        const patient = await prisma.patient.findUnique({
            where: {
                userId
            }
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient profile not found"
            });
        }

        const prescriptions = await prisma.prescription.findMany({
            where: {
                patientId: patient.id,
                deletedAt: null
            },
            include: {
                doctor: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return res.status(200).json({
            success: true,
            message: "Prescriptions retrieved successfully",
            data: prescriptions
        });

    } catch (error) {
        console.error("Error retrieving patient prescriptions:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
