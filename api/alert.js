import axios from 'axios';

export default async function handler(req, res) {
    // הדפסה ביומן כדי שנדע שהפונקציה התעוררה
    console.log("--- תחילת ריצה: בדיקת התרעות צבע אדום ---");
    
    const YEMOT_TOKEN = process.env.YEMOT_TOKEN;
    const SOURCE_API = 'https://api.tzevaadom.co.il/notifications';

    // בדיקה אם הטוקן הוגדר בורסל
    if (!YEMOT_TOKEN) {
        console.error("שגיאה: YEMOT_TOKEN לא מוגדר במשתני הסביבה של ורסל!");
        return res.status(500).json({ error: "Missing YEMOT_TOKEN" });
    }

    try {
        // 1. משיכת נתונים מה-API של צבע אדום
        console.log("מושך נתונים מ-api.tzevaadom.co.il...");
        const response = await axios.get(SOURCE_API);
        const lastAlert = response.data[0]; 

        if (!lastAlert) {
            console.log("לא נמצאו התרעות כלל במערכת.");
            return res.status(200).json({ message: "אין התרעות כרגע" });
        }

        // 2. חישוב זמן: בדיקה האם ההתרעה קרתה ב-90 השניות האחרונות
        const now = Math.floor(Date.now() / 1000);
        const alertTime = lastAlert.time;
        const diffInSeconds = now - alertTime;

        console.log(`התרעה אחרונה נמצאה ב: ${lastAlert.cities.join(", ")}`);
        console.log(`זמן שעבר מאז האזעקה: ${diffInSeconds} שניות`);

        // אם עברו פחות מ-90 שניות, שלח לימות המשיח
        if (diffInSeconds < 90) {
            const cities = lastAlert.cities.join(", ");
            const message = `שימו לב, התרעה חדשה ביישובים: ${cities}`;

            console.log("התרעה רלוונטית! שולח פקודה לימות המשיח...");

            // 3. שליחה לימות המשיח
            const yemotResponse = await axios.get("https://www.call2all.co.il/ym/api/RunCampaign", {
                params: {
                    token: YEMOT_TOKEN,
                    type: 'tts',
                    message: message,
                    list: '1'
                }
            });

            console.log("תשובה מימות המשיח:", JSON.stringify(yemotResponse.data));
            return res.status(200).json({ status: "Alert sent!", cities });
        }

        console.log("ההתרעה ישנה מדי, לא מבצע פעולה.");
        return res.status(200).json({ status: "Old alert, skipping", diff: diffInSeconds });

    } catch (error) {
        console.error("שגיאה במהלך הריצה:", error.message);
        return res.status(500).json({ error: error.message });
    }
}
