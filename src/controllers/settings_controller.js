// controllers/setting_controller.js
import { prisma } from "../config/db.js";

export const getSettings = async (req, res) => {
    try {
        const settings = await prisma.setting.findMany();
        const formatted = {};
        settings.forEach(s => {
            formatted[s.key] = s.value;
        });
        return res.json({ success: true, data: formatted });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSettings = async (req, res) => {
    try {
        const { settings } = req.body;
        const promises = Object.entries(settings).map(([key, value]) =>
            prisma.setting.upsert({
                where: { key },
                update: { value },
                create: { key, value },
            })
        );
        await Promise.all(promises);
        return res.json({ success: true, message: "Settings updated" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};