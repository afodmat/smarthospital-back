import { prisma } from "../config/db.js";
import { doctorInfoValidation, createDoctorValidation } from "../validators/doctor_validator.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "../lib/email.js";

function getApiUrl() {
    const configuredUrl = process.env.APP_URL;
    return configuredUrl && /^https?:\/\//i.test(configuredUrl)
        ? configuredUrl.replace(/\/$/, '')
        : `http://127.0.0.1:${process.env.PORT}`;
}
export const getAllDoctorsController = async(req , res) =>{
    try {
        const doctors = await prisma.doctor.findMany({
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
            message: "doctors retrieved successfully",
            count: doctors.length,
            doctors
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

export const getDoctorByIdController = async(req, res) =>{
    try {

        const doctorId = Number(req.params.id);

        const doctor = await prisma.doctor.findUnique({
            where: {
                id: doctorId
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

        if (!doctor) {
            return res.status(404).json({
                message: "doctor not found"
            });
        }

        return res.status(200).json({
            doctor
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });

    }
}

export const getMyDoctorController = async (req, res) => {
    try {
        const doctor = await prisma.doctor.findUnique({
            where: { userId: req.user.id },
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

        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor profile not found' });
        }

        return res.status(200).json({ success: true, data: doctor });
    } catch (error) {
        console.error('Get my doctor profile error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const updateDoctorProfileController = async(req, res) =>{
    try {
    
            const result = doctorInfoValidation.safeParse(req.body);
    
            if (!result.success) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: result.error.flatten()
                });
            }
    
            const userId = req.user.id;
    
            const doctor = await prisma.doctor.update({
                where: {
                    userId
                },
                data: result.data
            });
    
            return res.status(200).json({
                message: "doctor profile updated successfully",
                doctor
            });
    
        } catch (error) {
    
            console.error(error);
    
            return res.status(500).json({
                message: "Internal server error"
            });
    
        }
}

export const createDoctorController = async (req, res) => {
    try {
        const adminRole = req.user.role;

        // Only ADMIN and SUPER_ADMIN can create doctors
        if (adminRole !== "ADMIN" && adminRole !== "SUPER_ADMIN") {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to create doctors"
            });
        }

        // Validate request body
        const result = createDoctorValidation.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten()
            });
        }

        const {
            firstName,
            lastName,
            otherNames,
            email,
            password,
            phoneNumber,
            specialty,
            yearsOfExperience,
            dateOfBirth,
            gender,
            bio
        } = result.data;
        const normalizedEmail = email.toLowerCase().trim();

        // Check whether email already exists
        const existingUser = await prisma.user.findUnique({
            where: {
                email: normalizedEmail
            }
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "A user with this email already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create User + Doctor atomically
        const newDoctor = await prisma.$transaction(async (tx) => {

            const user = await tx.user.create({
                data: {
                    firstName,
                    lastName,
                    otherNames: otherNames || null,
                    email: normalizedEmail,
                    password: hashedPassword,
                    role: "DOCTOR",
                    isEmailVerified: false
                }
            });

            const doctor = await tx.doctor.create({
                data: {
                    userId: user.id,
                    phoneNumber: phoneNumber || null,
                    specialty: specialty || null,
                    yearsOfExperience:
                        yearsOfExperience ?? null,
                    dateOfBirth:
                        dateOfBirth ? new Date(dateOfBirth) : null,
                    gender: gender || null,
                    bio: bio || null
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

            return doctor;
        });
        let verificationEmailSent = true;

        try {
        await sendDoctorVerificationEmail(newDoctor.user);
        } catch (emailError) {
        verificationEmailSent = false;
        console.error("Doctor was created, but verification email failed:", emailError);
        }
        return res.status(201).json({
        success: true,
        message: verificationEmailSent
            ? "Doctor created and verification email sent."
            : "Doctor created, but the verification email could not be sent. Please resend it.",
        verificationRequired: true,
        verificationEmailSent,
        data: newDoctor,
        });
        // return res.status(201).json({
        //     success: true,
        //     message: "Doctor registered successfully. A verification email has been sent.",
        //     verificationRequired: true,
        //     data: newDoctor
        // });

    } catch (error) {
        console.error("❌ Error creating doctor:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const deleteDoctorController = async (req, res) => {
    try {
        const doctorId = Number(req.params.id);

        // Check if doctor exists
        const doctor = await prisma.doctor.findUnique({
            where: { id: doctorId },
            include: { user: true }
        });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        // Soft delete - update deletedAt
        await prisma.$transaction([
            prisma.doctor.update({
                where: { id: doctorId },
                data: { deletedAt: new Date() }
            }),
            prisma.user.update({
                where: { id: doctor.userId },
                data: { deletedAt: new Date() }
            })
        ]);

        return res.status(200).json({
            success: true,
            message: "Doctor deleted successfully"
        });

    } catch (error) {
        console.error('❌ Error deleting doctor:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const getDoctorsForAppointmentController = async (req, res) => {
    try {
        const doctors = await prisma.doctor.findMany({
            where: {
                deletedAt: null,
                user: {
                    deletedAt: null
                }
            },
            select: {
                id: true,
                specialty: true,
                yearsOfExperience: true,
                bio: true,

                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        otherNames: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return res.status(200).json({
            success: true,
            count: doctors.length,
            data: doctors
        });

    } catch (error) {
        console.error(
            'Get doctors for appointment error:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

async function sendDoctorVerificationEmail(user) {
  const verifyToken = jwt.sign(
    { sub: user.id, purpose: "email-verification" },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "1d" }
  );

  const verifyUrl = `${getApiUrl()}/auth/verify-email?token=${verifyToken}`;

  await sendEmail(
    user.email,
    "Verify your doctor account",
    `
      <p>Hello ${user.firstName},</p>
      <p>Your doctor account has been created. Verify your email to activate it:</p>
      <p><a href="${verifyUrl}">Verify my email</a></p>
      <p>This link expires in 24 hours.</p>
    `
  );
}

export const resendDoctorVerificationController = async (req, res) => {
  try {
    const doctorId = Number(req.params.id);

    const doctor = await prisma.doctor.findFirst({
      where: { id: doctorId, deletedAt: null },
      include: { user: true },
    });

    if (!doctor || doctor.user.deletedAt) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (doctor.user.isEmailVerified) {
      return res.status(400).json({
        message: "This doctor's email is already verified",
      });
    }

    await sendDoctorVerificationEmail(doctor.user);

    return res.json({
      success: true,
      message: "Verification email resent successfully",
    });
  } catch (error) {
    console.error("Resend doctor verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to resend verification email",
    });
  }
};