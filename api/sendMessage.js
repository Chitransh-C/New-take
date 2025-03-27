export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { orderId, customerPhone } = req.body;
    if (!orderId || !customerPhone) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE;

    const message = `Your order (${orderId}) has been placed successfully!`;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const data = new URLSearchParams({
        From: `${twilioPhone}`,
        To: `whatsapp:${customerPhone}`,
        Body: message
    });

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: data.toString()
        });

        const result = await response.json();

        if (response.ok) {
            return res.status(200).json({ success: true, message: "WhatsApp message sent successfully." });
        } else {
            return res.status(500).json({ error: result.message });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
