// scripts/create-super-admin.js
import { prisma } from "../src/config/db.js";
import { hashPassword } from "../src/lib/hash.js";
import dotenv from 'dotenv';

dotenv.config();

async function createSuperAdmin() {
    try {
        const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@hospital.com';
        const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';
        const firstName = process.env.SUPER_ADMIN_FIRST_NAME || 'Super';
        const lastName = process.env.SUPER_ADMIN_LAST_NAME || 'Admin';

        // Check if super admin already exists
        const existing = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() }
        });

        if (existing) {
            console.log('⚠️ Super Admin already exists:', email);
            console.log('👤 ID:', existing.id);
            console.log('📧 Email:', existing.email);
            console.log('👑 Role:', existing.role);
            return;
        }

        const passwordHash = await hashPassword(password);

        const superAdmin = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email: email.toLowerCase().trim(),
                password: passwordHash,
                role: 'SUPER_ADMIN',
                isEmailVerified: true,
                twoFactorEnabled: false,
            }
        });

        console.log('✅ Super Admin created successfully!');
        console.log('👤 ID:', superAdmin.id);
        console.log('📧 Email:', superAdmin.email);
        console.log('👑 Role:', superAdmin.role);
        console.log('');
        console.log('🔑 You can now login with:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log('');
        console.log('⚠️ Please change the password after first login!');

    } catch (error) {
        console.error('❌ Error creating Super Admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createSuperAdmin();