import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, collection, getDocs,getDoc,setDoc, addDoc, doc, updateDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

// Firebase Setup
async function getFirebaseConfig() {
    try {
        const response = await fetch("/api/getFirebaseConfig");
        if (!response.ok) throw new Error("Failed to fetch Firebase configuration");
        return await response.json();
    } catch (error) {
        console.error("❌ Error fetching Firebase config:", error);
        return null;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const firebaseConfig = await getFirebaseConfig();
    if (!firebaseConfig) {
        alert("Failed to load Firebase.");
        return;
    }

    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("✅ Firebase initialized securely.");

    onAuthStateChanged(auth, (user) => {
        if (!user) {
            alert("Unauthorized access!");
            window.location.href = "index.html";
        } else {
            fetchOrders();
        }
    });
});





let cart = [];
let isLoggingOut = false;
// 🔹 Fetch Ready and Completed Orders (Real-time)
async function getTwilioConfig() {
    try {
        const response = await fetch("./twilio-config.json", { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Failed to load Twilio config: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("❌ Error loading Twilio config:", error);
        alert("Twilio configuration failed to load. Check console for details.");
        return null;
    }
}



function fetchOrders() {
    const ordersRef = collection(db, "orders");

    onSnapshot(ordersRef, (querySnapshot) => {
        document.getElementById("ready-orders-list").innerHTML = "";
        document.getElementById("completed-orders-list").innerHTML = "";

        querySnapshot.forEach((docSnap) => {
            const order = docSnap.data();
            const orderId = order.orderId || docSnap.id;
            const status = order.status || "Unknown";

            const orderDiv = document.createElement("div");
            orderDiv.classList.add("order");
            orderDiv.innerHTML = `<strong>Order ID:</strong> ${orderId}<br><strong>Status:</strong> ${status}`;

            if (status === "Ready") {
                const completeBtn = document.createElement("button");
                completeBtn.textContent = "Mark as Completed";
                completeBtn.classList.add("complete-btn");
                completeBtn.onclick = () => updateOrderStatus(docSnap.id, "Completed");
                orderDiv.appendChild(completeBtn);
                document.getElementById("ready-orders-list").appendChild(orderDiv);
            } else if (status === "Completed") {
                document.getElementById("completed-orders-list").appendChild(orderDiv);
            }
        });
    }, (error) => {
        console.error("Error fetching orders:", error);
    });
}

// 🔹 Update Order Status
// 🔹 Update Order Status and Send WhatsApp Notification
async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch('/api/updateOrder', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, status: newStatus })
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
        alert(`Error: ${error.message}`);
    }
}

// 🔹 Load menu from Firestore
window.menuItems = []; 

// 🔹 Load menu from Firestore
// 🔹 Load Menu from Firestore
async function loadMenu() {
    const menuContainer = document.getElementById("menu");
    menuContainer.innerHTML = "";

    const menuCollection = collection(db, "menu");
    const menuSnapshot = await getDocs(menuCollection);
    
    window.menuItems = []; // Store menu for filtering

    menuSnapshot.forEach(doc => {
        const item = doc.data();
        if (!item.category) item.category = "Uncategorized"; // Default category if missing
        window.menuItems.push(item);
    });

    displayMenu(window.menuItems);
}


// 🔹 Display Menu Items in Grid
// 🔹 Display Menu Items in Grid
function displayMenu(menuList) {
    const menuContainer = document.getElementById("menu");
    menuContainer.innerHTML = "";

    menuList.forEach(item => {
        let itemElement = document.createElement("div");
        itemElement.classList.add("menu-item");
        itemElement.setAttribute("data-category", item.category);
        itemElement.innerHTML = `
            <h3>${item.name}</h3>
            <p>₹${item.price}</p>
            <button onclick="addToCart('${item.name}', ${item.price})">Add to Cart</button>
        `;
        menuContainer.appendChild(itemElement);
    });
}

// 🔹 Filter Menu by Fixed Categories
function filterCategory(category) {
    if (!Array.isArray(window.menuItems) || window.menuItems.length === 0) {
        console.warn("Menu items are not loaded yet.");
        return; // Prevents errors when menu is empty
    }

    let filteredItems = category === "All" 
        ? window.menuItems 
        : window.menuItems.filter(item => item.category === category);

    displayMenu(filteredItems);
}

function filterMenu() {
    if (!Array.isArray(window.menuItems) || window.menuItems.length === 0) {
        console.warn("Menu items are not loaded yet.");
        return;
    }

    let query = document.getElementById("menu-search").value.toLowerCase();
    let filteredItems = window.menuItems.filter(item => 
        item.name.toLowerCase().includes(query)
    );

    displayMenu(filteredItems);
}


// 🔹 Add item to cart
window.addToCart = function(name, price) {
    let existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1 });
    }
    updateCartUI();
};

// 🔹 Update Cart UI
function updateCartUI() {
    let cartItemsList = document.getElementById("cart-items");
    let cartTotal = document.getElementById("cart-total");

    cartItemsList.innerHTML = "";  // ✅ Clear existing list
    let total = 0;

    cart.forEach((item, index) => { // ✅ Add index parameter
        total += item.price * item.quantity;

        let li = document.createElement("li");
        li.innerHTML = `${item.name} (x${item.quantity}) - ₹${item.price * item.quantity} `;

        // ✅ Create Remove Button
        let removeBtn = document.createElement("button");
        removeBtn.textContent = "Remove";
        removeBtn.classList.add("remove-btn"); 
        removeBtn.onclick = function() { removeFromCart(index); }; // ✅ Pass correct index

        li.appendChild(removeBtn);
        cartItemsList.appendChild(li);
    });

    cartTotal.textContent = total.toFixed(2);

    if (cart.length === 0) {
        cartItemsList.innerHTML = "<li>Cart is empty</li>";
    }
}



// 🔹 Place Cash Order


// 🔹 Show selected section
window.showSection = function(sectionId) {
    document.querySelectorAll('.section').forEach(section => section.style.display = "none");
    document.getElementById(sectionId).style.display = "block";
};

// 🔹 Handle Logout
document.getElementById("logout-btn").addEventListener("click", async function() {
    try {
    isLoggingOut = true;
                alert("Logging Out...");
        await signOut(auth);
        window.location.href = "index.html";
    } catch (error) {
        console.error("Logout failed:", error);
    }
});

// 🔹 Function to Generate Correct Order ID
// 🔹 Function to Generate Correct Order ID
async function generateCashOrderId() {
    const now = new Date();
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const month = months[now.getMonth()]; 
    const date = now.getDate().toString().padStart(2, "0"); 
    const year = now.getFullYear().toString().slice(-2); 

    const orderCounterRef = doc(db, "orderCounters", `${month}${date}${year}`);
    const orderCounterSnap = await getDoc(orderCounterRef);

    let lastNumber = orderCounterSnap.exists() ? orderCounterSnap.data().lastUsedNumber : 1000;
    let uniqueNumber = lastNumber + 1;

    if (orderCounterSnap.exists()) {
    await updateDoc(orderCounterRef, { lastUsedNumber: uniqueNumber });
} else {
    await setDoc(orderCounterRef, { lastUsedNumber: uniqueNumber });
}


    return `CASH${month}${date}${year}${uniqueNumber}`;
}

//remove
function removeFromCart(index) {
    cart.splice(index, 1); // Remove the item at the given index
    updateCartUI(); // Refresh cart UI
}

// 🔹 Handle Cash Order Placement
document.addEventListener("DOMContentLoaded", function () {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
        if (isLoggingOut) {
                isLoggingOut = false; // Reset flag after logout
            }else{
            alert("Unauthorized access!");}
            window.location.href = "index.html";
        } else {
            fetchOrders();
            loadMenu();
            showSection("ready-orders");
            document.getElementById("all-btn").addEventListener("click", () => filterCategory("All")); document.getElementById("starters-btn").addEventListener("click", () => filterCategory("Starters")); document.getElementById("main-course-btn").addEventListener("click", () => filterCategory("Main Course")); document.getElementById("desserts-btn").addEventListener("click", () => filterCategory("Desserts")); document.getElementById("beverages-btn").addEventListener("click", () => filterCategory("Beverages")); 
        }
    });

    // ✅ Place Order Event Listener Inside `DOMContentLoaded`
    const placeOrderBtn = document.getElementById("place-order-btn");
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener("click", async function() {
            let customerName = document.getElementById("customer-name")?.value.trim() || "Guest";
            let customerPhone = document.getElementById("customer-phone")?.value.trim();

            if (!customerPhone || !customerPhone.match(/^\d{10}$/)) {
                alert("❌ Please enter a valid 10-digit phone number.");
                return;
            }

            let orderId = await generateCashOrderId();  // ✅ FIXED ORDER ID GENERATION

            await addDoc(collection(db, "orders"), {
                orderId: orderId,
                customer: customerName,
                phone: customerPhone,
                items: cart,
                status: "New",
                timestamp: serverTimestamp()
            });

            alert(`✅ Order Placed! Order ID: ${orderId}`);
            cart = [];
            updateCartUI();
                await sendOrderConfirmation(orderId, customerPhone);

        });
    }
});

// 🔹 Send WhatsApp Notification After Status Update

// 🔹 Send WhatsApp Confirmation After Order is Placed



async function sendOrderConfirmation(orderId, customerPhone) {
    console.log("✅ Inside sendOrderConfirmation() function.");

    if (!customerPhone.startsWith("+")) {
        customerPhone = `+91${customerPhone}`;
    }

    try {
        const response = await fetch('/api/sendMessage', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ orderId, customerPhone })
        });

        const result = await response.json();
        if (response.ok) {
            console.log("✅ WhatsApp message sent successfully.");
        } else {
            console.error("❌ Failed to send WhatsApp message:", result.error);
            alert(`Failed to send WhatsApp confirmation: ${result.error}`);
        }
    } catch (error) {
        console.error("❌ Error sending WhatsApp message:", error);
        alert(`Error sending WhatsApp message: ${error.message}`);
    }
}
