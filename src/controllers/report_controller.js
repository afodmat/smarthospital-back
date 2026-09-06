// controllers/report_controller.js
import { prisma } from "../config/db.js";

// ========================================
// GET DASHBOARD STATS (Overview)
// ========================================

export const getDashboardStats = async (req, res) => {
    try {
        // Only Admins can view reports
        if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin privileges required."
            });
        }

        // Get all counts in parallel
        const [
            totalPatients,
            totalDoctors,
            totalAdmins,
            totalAppointments,
            todayAppointments,
            pendingAppointments,
            completedAppointments,
            cancelledAppointments,
        ] = await Promise.all([
            prisma.patient.count({ where: { deletedAt: null } }),
            prisma.doctor.count({ where: { deletedAt: null } }),
            prisma.user.count({
                where: {
                    role: { in: ['ADMIN', 'SUPER_ADMIN'] },
                    deletedAt: null
                }
            }),
            prisma.appointment.count({ where: { deletedAt: null } }),
            prisma.appointment.count({
                where: {
                    deletedAt: null,
                    scheduledAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lt: new Date(new Date().setHours(23, 59, 59, 999))
                    }
                }
            }),
            prisma.appointment.count({
                where: {
                    deletedAt: null,
                    status: 'pending'
                }
            }),
            prisma.appointment.count({
                where: {
                    deletedAt: null,
                    status: 'confirmed'
                }
            }),
            prisma.appointment.count({
                where: {
                    deletedAt: null,
                    status: 'cancelled'
                }
            }),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                patients: {
                    total: totalPatients,
                    active: totalPatients, // You can add active/inactive logic
                },
                doctors: {
                    total: totalDoctors,
                    active: totalDoctors,
                },
                admins: {
                    total: totalAdmins,
                },
                appointments: {
                    total: totalAppointments,
                    today: todayAppointments,
                    pending: pendingAppointments,
                    completed: completedAppointments,
                    cancelled: cancelledAppointments,
                },
            }
        });

    } catch (error) {
        console.error('Get dashboard stats error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// ========================================
// GET APPOINTMENT TRENDS (Line Chart)
// ========================================

export const getAppointmentTrends = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin privileges required."
            });
        }

        const { period = 'week' } = req.query;
        let startDate, endDate, groupBy;

        const now = new Date();

        switch (period) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 7);
                groupBy = 'day';
                break;
            case 'month':
                startDate = new Date(now);
                startDate.setMonth(startDate.getMonth() - 1);
                groupBy = 'day';
                break;
            case 'year':
                startDate = new Date(now);
                startDate.setFullYear(startDate.getFullYear() - 1);
                groupBy = 'month';
                break;
            default:
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 7);
                groupBy = 'day';
        }

        // Get appointments with grouping
        const appointments = await prisma.appointment.findMany({
            where: {
                deletedAt: null,
                scheduledAt: {
                    gte: startDate,
                    lte: now,
                }
            },
            select: {
                scheduledAt: true,
                status: true,
            },
            orderBy: {
                scheduledAt: 'asc'
            }
        });

        // Group data by date
        const groupedData = {};
        appointments.forEach(app => {
            if (!app.scheduledAt) return;
            const dateKey = app.scheduledAt.toISOString().split('T')[0];
            if (!groupedData[dateKey]) {
                groupedData[dateKey] = { total: 0, completed: 0, pending: 0, cancelled: 0 };
            }
            groupedData[dateKey].total++;
            if (app.status === 'confirmed') groupedData[dateKey].completed++;
            if (app.status === 'pending') groupedData[dateKey].pending++;
            if (app.status === 'cancelled') groupedData[dateKey].cancelled++;
        });

        // Format for chart
        const labels = Object.keys(groupedData);
        const data = {
            labels,
            datasets: {
                total: labels.map(d => groupedData[d].total),
                completed: labels.map(d => groupedData[d].completed),
                pending: labels.map(d => groupedData[d].pending),
                cancelled: labels.map(d => groupedData[d].cancelled),
            }
        };

        return res.status(200).json({
            success: true,
            data,
            period,
            startDate,
            endDate: now,
        });

    } catch (error) {
        console.error('Get appointment trends error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// ========================================
// GET DEPARTMENT DISTRIBUTION (Pie/Donut Chart)
// ========================================

export const getDepartmentDistribution = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin privileges required."
            });
        }

        // Get doctors grouped by specialty
        const doctors = await prisma.doctor.groupBy({
            by: ['specialty'],
            where: {
                deletedAt: null,
                specialty: { not: null }
            },
            _count: {
                id: true
            }
        });

        const distribution = doctors.map(d => ({
            specialty: d.specialty || 'Unspecified',
            count: d._count.id
        }));

        // Also get patients per department (via appointments)
        // This is a simplified version
        const totalDoctors = distribution.reduce((sum, d) => sum + d.count, 0);

        return res.status(200).json({
            success: true,
            data: distribution,
            total: totalDoctors,
        });

    } catch (error) {
        console.error('Get department distribution error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// ========================================
// GET PATIENT GROWTH (Line Chart)
// ========================================

export const getPatientGrowth = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin privileges required."
            });
        }

        const { period = '6months' } = req.query;
        const now = new Date();

        let startDate;
        let groupFormat;

        switch (period) {
            case '3months':
                startDate = new Date(now);
                startDate.setMonth(startDate.getMonth() - 3);
                groupFormat = 'month';
                break;
            case '6months':
                startDate = new Date(now);
                startDate.setMonth(startDate.getMonth() - 6);
                groupFormat = 'month';
                break;
            case 'year':
                startDate = new Date(now);
                startDate.setFullYear(startDate.getFullYear() - 1);
                groupFormat = 'month';
                break;
            default:
                startDate = new Date(now);
                startDate.setMonth(startDate.getMonth() - 6);
                groupFormat = 'month';
        }

        // Get patients created in the period
        const patients = await prisma.patient.findMany({
            where: {
                deletedAt: null,
                createdAt: {
                    gte: startDate,
                    lte: now,
                }
            },
            select: {
                createdAt: true,
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // Group by month
        const grouped = {};
        patients.forEach(p => {
            const key = p.createdAt.toISOString().slice(0, 7); // YYYY-MM
            grouped[key] = (grouped[key] || 0) + 1;
        });

        // Generate all months in range
        const labels = [];
        const data = [];
        const current = new Date(startDate);
        while (current <= now) {
            const key = current.toISOString().slice(0, 7);
            labels.push(current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
            data.push(grouped[key] || 0);
            current.setMonth(current.getMonth() + 1);
        }

        return res.status(200).json({
            success: true,
            data: {
                labels,
                values: data,
                total: patients.length,
            }
        });

    } catch (error) {
        console.error('Get patient growth error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// ========================================
// GET REVENUE REPORT (Financial)
// ========================================

export const getRevenueReport = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin privileges required."
            });
        }

        const { period = 'month' } = req.query;
        const now = new Date();

        // This is mock data since you don't have billing yet
        // Replace with actual billing data when available
        const mockRevenue = {
            'day': { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], values: [320, 450, 280, 520, 610, 180, 90] },
            'week': { labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], values: [1800, 2200, 1900, 2500] },
            'month': { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'], values: [3200, 3800, 4200, 3900, 4500, 5100, 4800] },
            'year': { labels: ['2023', '2024', '2025'], values: [38000, 42000, 15200] },
        };

        const data = mockRevenue[period] || mockRevenue['month'];

        return res.status(200).json({
            success: true,
            data,
            period,
            total: data.values.reduce((a, b) => a + b, 0),
        });

    } catch (error) {
        console.error('Get revenue report error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// ========================================
// EXPORT REPORT (CSV)
// ========================================

export const exportReport = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin privileges required."
            });
        }

        const { type = 'appointments' } = req.query;
        let data = [];
        let headers = [];
        let filename = 'report';

        if (type === 'appointments') {
            const appointments = await prisma.appointment.findMany({
                where: { deletedAt: null },
                include: {
                    doctor: {
                        include: {
                            user: { select: { firstName: true, lastName: true } }
                        }
                    },
                    patient: {
                        include: {
                            user: { select: { firstName: true, lastName: true } }
                        }
                    }
                },
                take: 100,
            });

            headers = ['ID', 'Patient', 'Doctor', 'Date', 'Status'];
            data = appointments.map(a => [
                a.id,
                `${a.patient?.user?.firstName || ''} ${a.patient?.user?.lastName || ''}`.trim(),
                `Dr. ${a.doctor?.user?.firstName || ''} ${a.doctor?.user?.lastName || ''}`.trim(),
                a.scheduledAt ? new Date(a.scheduledAt).toLocaleDateString() : 'N/A',
                a.status,
            ]);
            filename = 'appointments_report';
        }

        if (type === 'patients') {
            const patients = await prisma.patient.findMany({
                where: { deletedAt: null },
                include: {
                    user: { select: { firstName: true, lastName: true, email: true } }
                },
                take: 100,
            });

            headers = ['ID', 'Name', 'Email', 'Phone', 'Registered'];
            data = patients.map(p => [
                p.id,
                `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.trim(),
                p.user?.email || 'N/A',
                p.phoneNumber || 'N/A',
                p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A',
            ]);
            filename = 'patients_report';
        }

        // Create CSV
        let csv = headers.join(',') + '\n';
        data.forEach(row => {
            csv += row.join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
        res.status(200).send(csv);

    } catch (error) {
        console.error('Export report error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};