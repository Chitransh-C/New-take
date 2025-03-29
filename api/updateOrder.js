import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { orderId, status, customerPhone } = req.body;
    if (!orderId || !status || !customerPhone) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // ✅ Fetch Firebase Config
        const firebaseConfig = await fetchFirebaseConfig();
        
        // ✅ Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        // ✅ Update Order Status in Firestore
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, { status: status });
        console.log(`✅ Order ${orderId} status updated to: ${status}`);

        // ✅ Send WhatsApp Notification
        await sendWhatsAppMessage(orderId, status, customerPhone);

        return res.status(200).json({ success: true, message: "Order updated successfully" });
    } catch (error) {
        console.error("❌ Error updating order:", error);
        return res.status(500).json({ error: error.message });
    }
}
// ✅ Function to Fetch Firebase Config
async function fetchFirebaseConfig() {
    const response = await fetch('/api/getFirebaseConfig'); // Update this endpoint if needed
    if (!response.ok) {
        throw new Error("Failed to fetch Firebase configuration");
    }
    return response.json();
}

// ✅ Function to Send WhatsApp Message via Twilio
async function sendWhatsAppMessage(orderId, status, customerPhone) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE;

    const message = `Your order (${orderId}) status has been updated to: ${status}`;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const data = new URLSearchParams({
        From: `whatsapp:${twilioPhone}`,
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
            console.log("✅ WhatsApp message sent successfully.");
        } else {
            console.error("❌ Failed to send WhatsApp message:", result);
        }
    } catch (error) {
        console.error("❌ Error sending WhatsApp message:", error);
    }
}
