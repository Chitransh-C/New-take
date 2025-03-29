import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";

import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, updateDoc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

let app, db, auth;
let isLoggingOut = false;
// Firebase Configuration
async function getFirebaseConfig() {
    try {
        const response = await fetch("/api/getFirebaseConfig");
        if (!response.ok) {
            throw new Error("Failed to fetch Firebase configuration");
        }
        return await response.json();
    } catch (error) {
        console.error("❌ Error fetching Firebase config:", error);
        return null;
    }
}




function fetchOrders() {
    const ordersRef = collection(db, "orders");

    onSnapshot(ordersRef, (querySnapshot) => {
        // Clear existing order lists
        document.getElementById("new-orders-list").innerHTML = "";
        document.getElementById("cooking-orders-list").innerHTML = "";
        document.getElementById("ready-orders-list").innerHTML = "";

        querySnapshot.forEach((docSnap) => {
            const order = docSnap.data();
            const orderId = order.orderId || docSnap.id;
            const items = order.items ? order.items.map(item => `${item.name} (x${item.quantity})`).join(", ") : "No items";
            const status = order.status || "New";

            const orderDiv = document.createElement("div");
            orderDiv.classList.add("order");
            orderDiv.innerHTML = `
                <strong>Order ID:</strong> ${orderId}<br>
                <strong>Items:</strong> ${items}<br>
                <strong>Status:</strong> ${status}
            `;

            if (status.toLowerCase() === "new") {
                const cookingBtn = document.createElement("button");
                cookingBtn.textContent = "Mark as Cooking";
                cookingBtn.classList.add("cooking-btn");
                cookingBtn.onclick = () => updateOrderStatus(docSnap.id, "Cooking");
                orderDiv.appendChild(cookingBtn);
                document.getElementById("new-orders-list").appendChild(orderDiv);
            } else if (status.toLowerCase() === "cooking") {
                const readyBtn = document.createElement("button");
                readyBtn.textContent = "Mark as Ready";
                readyBtn.classList.add("ready-btn");
                readyBtn.onclick = () => updateOrderStatus(docSnap.id, "Ready");
                orderDiv.appendChild(readyBtn);
                document.getElementById("cooking-orders-list").appendChild(orderDiv);
            } else if (status.toLowerCase() === "ready") {
                document.getElementById("ready-orders-list").appendChild(orderDiv);
            }
        });
    }, (error) => {
        console.error("❌ Error fetching real-time updates:", error);
        alert("Failed to fetch real-time updates");
    });
}

// Function to update order status in Firestore
// Function to update order status in Firestore and notify customer
async function updateOrderStatus(orderId, newStatus) {
    try {
    const orderRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
            console.error("❌ Order not found:", orderId);
            alert("Order not found");
            return;
        }

        const orderData = orderSnap.data();
       const customerPhone = "+91" + orderData.phone; // ✅ Get phone number from Firestore
        

        if (!customerPhone) {
            console.error("❌ Missing customer phone number");
            alert("Customer phone number not available.");
            return;
        }

    
    
        const response = await fetch('/api/updateOrder', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, status: newStatus, customerPhone })

        });

        const result = await response.json();
        if (response.ok) {
            console.log("✅ Order status updated successfully.");
        } else {
            console.error("❌ Failed to update order:", result.error);
            alert(`Failed to update order: ${result.error}`);
        }
    } catch (error) {
        console.error("❌ Error updating order:", error);
        alert(`Error updating order: ${error}`); 
    }
}



// ✅ Show "New Orders" section by default
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = "none"; // Hide all sections
    });

    // Show the selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.style.display = "block"; // Show the selected section
    } else {
        console.error("❌ Section not found:", sectionId);
    }
}
window.showSection = showSection;


 document.addEventListener("DOMContentLoaded", async () => {
 const firebaseConfig = await getFirebaseConfig();
    if (!firebaseConfig) {
        alert("Failed to load Firebase.");
        return;
    }

    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("✅ Firebase initialized securely.");
    
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            if (isLoggingOut) {
                isLoggingOut = false; // Reset flag after logout
            } else {
                alert("Unauthorized access!");
                window.location.href = "staff-login.html";
            }
            return;
        }

        console.log("✅ User authenticated:", user.email);
        showSection("new-orders"); // ✅ Show New Orders on page load
        fetchOrders(); // ✅ Fetch Orders after showing sections
    });

    // Logout Button Handling (Moved Inside DOMContentLoaded)
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            console.log("Logout button clicked.");
            try {
                isLoggingOut = true;
                alert("Logging Out...");
                await signOut(auth);
                console.log("User successfully signed out.");
                window.location.href = "index.html"; // Redirect to login page
            } catch (error) {
                console.error("❌ Error during logout:", error.message);
                alert("Logout failed. Please try again.");
            }
        });
    } else {
        console.error("Logout button not found in DOM.");
    }
});

// ✅ Send WhatsApp Notification After Status Update
// ✅ Send WhatsApp Notification After Status Update
