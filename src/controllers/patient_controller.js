import { prisma } from "../config/db.js";
import { patientInfo } from "../validators/patient_validator.js";

export const updatePatientProfileController = async (req, res) => {

    try {

        const result = patientInfo.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: result.error.flatten()
            });
        }

        const userId = req.user.id;

        const patient = await prisma.patient.update({
            where: {
                userId
            },
            data: result.data
        });

        return res.status(200).json({
            message: "Patient profile updated successfully",
            patient
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });

    }

};

export const getAllPatientsController = async(req , res) => {
    try {
        const patients = await prisma.patient.findMany({
            where: {
                deletedAt: null
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        otherNames: true,
                        email: true,
                        role: true,
                        isEmailVerified: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return res.status(200).json({
            message: "Patients retrieved successfully",
            count: patients.length,
            patients
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

export const getPatientByIdController = async (req, res) => {

    try {

        const patientId = Number.parseInt(req.params.id, 10);

        if (!Number.isInteger(patientId) || patientId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid patient ID"
            });
        }

        const patient = await prisma.patient.findUnique({
            where: {
                id: patientId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        otherNames: true,
                        email: true,
                        role: true,
                        isEmailVerified: true
                    }
                }
            }
        });

        if (!patient) {
            return res.status(404).json({
                message: "Patient not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: patient,
            patient
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });

    }

};

export const getMyPatientController = async (req, res) => {
    try {
        const patient = await prisma.patient.findUnique({
            where: {
                userId: req.user.id
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        otherNames: true,
                        email: true,
                        role: true,
                        isEmailVerified: true
                    }
                }
            }
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient profile not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: patient,
            patient
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};