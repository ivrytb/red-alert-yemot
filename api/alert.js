import axios from 'axios';

export default async function handler(req, res) {
    const YEMOT_TOKEN = process.env.YEMOT_TOKEN;
    const SOURCE_API = 'https://api.tzevaadom.co.il/notifications';

    try {
        // 1. משיכת נתונים מה-API של צבע אדום
        const response = await axios.get(SOURCE_API);
        const lastAlert = response.data[0]; 

        if (!lastAlert) {
            return res.status(200).json({ message: "אין התרעות כרגע" });
        }

        // 2. בדיקה האם ההתרעה קרתה ממש עכשיו (ב-15 השניות האחרונות)
        const now = Math.floor(Date.now() / 1000);
        const alertTime = lastAlert.time;

        if (now - alertTime < 15) {
            const cities = lastAlert.cities.join(", ");
            const message = `התרעה חדשה ביישובים: ${cities}`;

            // 3. שליחה לימות המשיח
            const yemotResponse = await axios.get("https://www.call2all.co.il/ym/api/RunCampaign", {
                params: {
                    token: YEMOT_TOKEN,
                    type: 'tts',
                    message: message,
                    list: '1'
                }
            });

            return res.status(200).json({ status: "Alert sent!", data: yemotResponse.data });
        }

        return res.status(200).json({ status: "Old alert, skipping" });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
