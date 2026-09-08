// controllers/appointment_controller.js
import { prisma } from "../config/db.js";
import { appointmentValidation, updateAppointmentValidation } from "../validators/appointment_validator.js";

// ========================================
// GET ALL APPOINTMENTS
// ========================================

export const getAllAppointments = async (req, res) => {
    try {
        const appointments = await prisma.appointment.findMany({
            where: {
                deletedAt: null
            },
            include: {
                doctor: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            }
                        }
                    }
                },
                patient: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return res.status(200).json({
            success: true,
            count: appointments.length,
            data: appointments
        });

    } catch (error) {
        console.error('Get all appointments error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
};

// ========================================
// GET APPOINTMENT BY ID
// ========================================

export const getAppointmentById = async (req, res) => {
    try {
        const appointmentId = parseInt(req.params.id);

        if (isNaN(appointmentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment ID"
            });
        }

        const appointment = await prisma.appointment.findFirst({
            where: {
                id: appointmentId,
                deletedAt: null
            },
            include: {
                doctor: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            }
                        }
                    }
                },
                patient: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            }
                        }
                    }
                }
            }
        });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: appointment
        });

    } catch (error) {
        console.error('Get appointment by ID error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
};

// ========================================
// GET APPOINTMENTS BY PATIENT ID
// ========================================

export const getAppointmentsByPatient = async (req, res) => {
    try {
        const patient = await prisma.patient.findFirst({
            where: {
                userId: req.user.id,
                deletedAt: null
            }
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient profile not found"
            });
        }

        const appointments = await prisma.appointment.findMany({
            where: {
                patientId: patient.id,
                deletedAt: null
            },
            include: {
                doctor: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                scheduledAt: 'asc'
            }
        });

        return res.status(200).json({
            success: true,
            count: appointments.length,
            data: appointments
        });

    } catch (error) {
        console.error(
            'Get appointments by patient error:',
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// ========================================
// GET APPOINTMENTS BY DOCTOR ID
// ========================================

export const getAppointmentsByDoctor = async (req, res) => {
    try {
        const doctorId = parseInt(req.params.doctorId);

        if (isNaN(doctorId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid doctor ID"
            });
        }

        const appointments = await prisma.appointment.findMany({
            where: {
                doctorId: doctorId,
                deletedAt: null
            },
            include: {
                patient: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                scheduledAt: 'asc'
            }
        });

        return res.status(200).json({
            success: true,
            count: appointments.length,
            data: appointments
        });

    } catch (error) {
        console.error('Get appointments by doctor error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// ========================================
// CREATE APPOINTMENT
// ========================================

export const createAppointment = async (req, res) => {
    try {
        const result = appointmentValidation.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten()
            });
        }

        const {
            doctorId,
            type,
            symptoms,
            additionalInfo,
        } = result.data;

        // Check if doctor exists
        const doctor = await prisma.doctor.findUnique({
            where: { id: doctorId }
        });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        // Check if patient exists
        const patient = await prisma.patient.findFirst({
            where: { userId: req.user.id
            }
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        const newAppointment = await prisma.appointment.create({
            data: {
                doctorId,
                patientId: patient.id,
                scheduledAt: new Date(),
                type: type,
                symptoms: symptoms || null,
                additionalInfo: additionalInfo || null,
                status: 'pending'
            },
            include: {
                doctor: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        }
                    }
                },
                patient: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        return res.status(201).json({
            success: true,
            message: "Appointment created successfully",
            data: newAppointment
        });

    } catch (error) {
        console.error('Create appointment error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
};

// ========================================
// UPDATE APPOINTMENT
// ========================================

export const updateAppointment = async (req, res) => {
    try {
        const appointmentId = parseInt(req.params.id);

        if (isNaN(appointmentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment ID"
            });
        }

        const result = updateAppointmentValidation.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten()
            });
        }

        // Check if appointment exists
        const existingAppointment = await prisma.appointment.findUnique({
            where: { id: appointmentId }
        });

        if (!existingAppointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        const updateData = {};
        if (result.data.scheduledAt) updateData.scheduledAt = new Data(result.date.scheduledAt);
        
        if (result.data.type) updateData.type = result.data.type;
        if (result.data.symptoms !== undefined) updateData.symptoms = result.data.symptoms;
        if (result.data.additionalInfo !== undefined) updateData.additionalInfo = result.data.additionalInfo;
        if (result.data.status) updateData.status = result.data.status;

        const updatedAppointment = await prisma.appointment.update({
            where: {
                id: appointmentId
            },
            data: updateData,
            include: {
                doctor: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            }
                        }
                    }
                },
                patient: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            }
                        }
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Appointment updated successfully",
            data: updatedAppointment
        });

    } catch (error) {
        console.error('Update appointment error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
};

// ========================================
// DELETE APPOINTMENT (Soft Delete)
// ========================================

export const deleteAppointment = async (req, res) => {
    try {
        const appointmentId = parseInt(req.params.id);

        if (isNaN(appointmentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment ID"
            });
        }

        const existingAppointment = await prisma.appointment.findUnique({
            where: { id: appointmentId }
        });

        if (!existingAppointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        const deletedAppointment = await prisma.appointment.update({
            where: {
                id: appointmentId
            },
            data: {
                deletedAt: new Date()
            }
        });

        return res.status(200).json({
            success: true,
            message: "Appointment deleted successfully",
            data: {
                id: deletedAppointment.id,
                deletedAt: deletedAppointment.deletedAt
            }
        });

    } catch (error) {
        console.error('Delete appointment error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
};