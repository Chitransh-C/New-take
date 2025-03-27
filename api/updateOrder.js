import { Buffer } from "buffer";

import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc } from "firebase/firestore";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { orderId, status, customerPhone } = req.body;
    if (!orderId || !status || !customerPhone) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // ✅ Initialize Firebase
    const firebaseConfig = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID
    };
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    try {
        // ✅ 1. Update Order Status in Firestore
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, { status: status });
        console.log(`✅ Order ${orderId} status updated to: ${status}`);

        // ✅ 2. Send WhatsApp Notification
        await sendWhatsAppMessage(orderId, status, customerPhone);

        return res.status(200).json({ success: true, message: "Order updated successfully" });
    } catch (error) {
        console.error("❌ Error updating order:", error);
        return res.status(500).json({ error: error.message });
    }
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
