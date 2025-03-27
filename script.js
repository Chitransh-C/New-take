let menu = []; 

// ✅ Import Firebase Modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// ✅ Firebase Configuration
let db = null; // ✅ Firebase will be initialized dynamically

document.addEventListener("DOMContentLoaded", async () => {
    const firebaseConfig = await getFirebaseConfig();
    if (!firebaseConfig) {
        alert("Failed to load Firebase. Please try again later.");
        return;
    }

    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("✅ Firebase initialized securely.");

    // ✅ Call functions that use Firestore only after it's initialized
    loadMenu();
    updateCartUI();

    // ✅ Attach Event Listeners after Firebase is ready
    let checkoutBtn = document.getElementById("checkoutBtn");
    checkoutBtn.addEventListener("click", function() {
        checkout();
    });

    let categoryButtons = document.querySelectorAll("#categoryNav button");
    categoryButtons.forEach(button => {
        button.addEventListener("click", function() {
            let category = button.textContent;
            filterMenu(category);
        });
    });
});


// ✅ Function to Fetch Firebase Config from Backend
async function getFirebaseConfig() {
    try {
        const response = await fetch("/api/getFirebaseConfig");
        if (!response.ok) {
            throw new Error("Failed to fetch Firebase configuration");
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching Firebase config:", error);
        return null;
    }
}








// ✅ Attach Event Listeners to Category Buttons


// ✅ Load Menu Items (You can modify this to fetch from Firestore if needed)

// ✅ Load Menu Items from Firestore
async function loadMenu() {
    const menuContainer = document.getElementById("menu");
    menuContainer.innerHTML = "";
    menu = []; // ✅ Reset menu array to avoid duplicates

    try {
        // ✅ Fetch menu items from Firestore collection 'menu'
        if (!db) {
    console.error("Firestore is not initialized.");
    return;
}

const menuCollection = collection(db, "menu");

        const menuSnapshot = await getDocs(menuCollection);

        // ✅ Loop through each document in the collection
        menuSnapshot.forEach(doc => {
            const item = doc.data();

            // ✅ Check if item has category and add to menu array
            if (!item.category) {
                item.category = "Uncategorized"; // ✅ Default if no category
            }
            menu.push(item); // Store item for filtering

            //alert("Loaded Item: " + item.name + " | Category: " + item.category); // ✅ Debugging Alert

            // ✅ Check if the item is available or the field is undefined
            if (item.available !== false) {
                // ✅ Create menu item elements with data-category attribute
                let itemElement = document.createElement("div");
                itemElement.classList.add("menu-item");
                itemElement.setAttribute("data-category", item.category);
                itemElement.innerHTML = `
                    <h3>${item.name}</h3>
                    <p>₹${item.price}</p>
                    <button class="add-to-cart">Add to Cart</button>
                `;

                // ✅ Attach Event Listener to Button
                let addButton = itemElement.querySelector(".add-to-cart");
                addButton.addEventListener("click", function() {
                    addToCart(item.name, item.price);
                });

                menuContainer.appendChild(itemElement); // ✅ Append to DOM
            }
        });

        //alert("Menu loaded successfully."); // ✅ Debugging Alert
    } catch (error) {
        console.error("Error loading menu: ", error); // Log detailed error
        alert("Failed to load menu. Please try again later.");
    }
}

// ✅ Filter Menu by Category Using data-category
function filterMenu(category) {
    //alert("Filtering Category: " + category); // ✅ Debugging Alert

    let allItems = document.querySelectorAll(".menu-item");

    allItems.forEach(item => {
        let itemCategory = item.getAttribute("data-category");

        if (category === "All" || itemCategory === category) {
            item.style.display = "block";
        } else {
            item.style.display = "none";
        }
    });
}

// ✅ Add Items to Cart with Alerts for Debugging
function addToCart(name, price) {
  //  alert("Adding to Cart: " + name + " - ₹" + price); // ✅ Debugging Alert

    // ✅ Get existing cart items or initialize an empty array
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    // ✅ Check if the item already exists in the cart
    let existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += 1;
       // alert("Updated Quantity: " + existingItem.quantity); // ✅ Alert Quantity Update
    } else {
        cart.push({ name, price, quantity: 1 });
        alert("New Item Added: " + name); // ✅ Alert New Item
    }

    // ✅ Save the updated cart back to local storage
    localStorage.setItem("cart", JSON.stringify(cart));

    // ✅ Update the Cart UI
    updateCartUI();
}

//remove
// ✅ Properly Define removeFromCart
// ✅ Improved removeFromCart() to Reduce Quantity or Remove Item
function removeFromCart(index) {
   // alert("Removing Item at Index: " + index); // ✅ Debugging Alert

    // ✅ Get current cart from local storage
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    // ✅ Check if the item quantity is more than 1
    if (cart[index].quantity > 1) {
        // ✅ Reduce Quantity by 1
        cart[index].quantity -= 1;
      //  alert("Reduced Quantity: " + cart[index].name + " (x" + cart[index].quantity + ")"); // ✅ Debugging Alert
    } else {
        // ✅ Remove the item completely if quantity is 1
       // alert("Removing Item: " + cart[index].name); // ✅ Debugging Alert
        cart.splice(index, 1);
    }

    // ✅ Save the updated cart back to local storage
    localStorage.setItem("cart", JSON.stringify(cart));

    // ✅ Update the Cart UI
    updateCartUI();

    //alert("Cart Updated."); // ✅ Confirm Update
}



// ✅ Update Cart UI with Event Listeners for Remove
function updateCartUI() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let cartItemsList = document.getElementById("cartItems");
    let cartTotal = document.getElementById("cartTotal");

    cartItemsList.innerHTML = ""; // Clear existing list
    let total = 0;

    cart.forEach((item, index) => {
        total += item.price * item.quantity;

        let li = document.createElement("li");
        li.style.display = "flex";
        li.style.alignItems = "center";
        li.style.justifyContent = "space-between";
        li.style.padding = "8px";
        li.style.marginBottom = "8px";  
        li.style.borderBottom = "1px solid #ddd";  

        // Item Name & Price
        let itemText = document.createElement("span");
        itemText.innerHTML = `${item.name} (₹${item.price})`;
        itemText.style.fontSize = "16px";

        // Quantity Controls Container
        let quantityDiv = document.createElement("div");
        quantityDiv.className = "quantity-container";  // Apply CSS spacing

        let minusBtn = document.createElement("button");
        minusBtn.textContent = "➖";
        minusBtn.className = "cart-btn";

        let quantityText = document.createElement("span");
        quantityText.textContent = ` ${item.quantity} `;
        quantityText.style.fontSize = "14px"; 

        let plusBtn = document.createElement("button");
        plusBtn.textContent = "➕";
        plusBtn.className = "cart-btn";

        // Remove (Bin) Button
        let removeButton = document.createElement("button");
        removeButton.innerHTML = "🗑️";  
        removeButton.className = "bin-btn";

        // Event Listeners for +/- & Remove
        minusBtn.addEventListener("click", function() {
            if (item.quantity > 1) {
                item.quantity -= 1;
            } else {
                cart.splice(index, 1); // Remove if quantity is 1
            }
            localStorage.setItem("cart", JSON.stringify(cart));
            updateCartUI();
        });

        plusBtn.addEventListener("click", function() {
            item.quantity += 1;
            localStorage.setItem("cart", JSON.stringify(cart));
            updateCartUI();
        });

        removeButton.addEventListener("click", function() {
            cart.splice(index, 1);
            localStorage.setItem("cart", JSON.stringify(cart));
            updateCartUI();
        });

        // Append Elements
        quantityDiv.appendChild(minusBtn);
        quantityDiv.appendChild(quantityText);
        quantityDiv.appendChild(plusBtn);

        li.appendChild(itemText);
        li.appendChild(quantityDiv);
        li.appendChild(removeButton);
        cartItemsList.appendChild(li);
    });

    // Update Total
    cartTotal.textContent = total.toFixed(2);
}
window.checkout = checkout;

// ✅ Checkout (Saves Order to Firestore)
async function checkout() {
    const customerName = document.getElementById("customer-name").value.trim() || "Guest";
    const customerPhone = document.getElementById("customer-phone").value.trim();
    const cartItems = JSON.parse(localStorage.getItem("cart")) || [];

    if (!/^\d{10}$/.test(customerPhone)) {
        alert("Please enter a valid 10-digit phone number.");
        return;
    }

    if (cartItems.length === 0) {
        alert("Your cart is empty. Add items before proceeding.");
        return;
    }

    if (!db) {
        alert("Firestore is not initialized. Please try again later.");
        return;
    }

    // Get current date in DDMMYY format
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB").replace(/\//g, "").slice(0, 6); // DDMMYY

    try {
        // Fetch last used order number from Firestore
        const orderCounterRef = doc(db, "orderCounters", dateStr);
        const orderCounterSnap = await getDoc(orderCounterRef);
        const lastNumber = orderCounterSnap.exists() ? orderCounterSnap.data().lastUsedNumber : 1000;

        // Generate new order ID
        const uniqueNumber = lastNumber + 1;
        const orderId = `ORD${dateStr}${uniqueNumber}`;

        // Update Firestore with the latest order number
        await setDoc(orderCounterRef, { lastUsedNumber: uniqueNumber });

        // Save order details in Firestore
        await addDoc(collection(db, "orders"), {
            orderId,
            customer: customerName,
            phone: customerPhone,
            items: cartItems,
            status: "New",
            timestamp: serverTimestamp()
        });

        console.log('✅ Order saved to Firestore. Sending WhatsApp confirmation...');
        
        // Send WhatsApp confirmation
        await sendOrderConfirmation(orderId, customerPhone);

        // Notify user & clear cart
        alert(`Order placed successfully! 🎉\nYour Order ID: ${orderId}`);
        clearCart();
    } catch (error) {
        console.error("Error processing order:", error);
        alert("Something went wrong. Please try again.");
    }
}

// Helper function to clear cart and reset UI
function clearCart() {
    localStorage.removeItem("cart");
    document.getElementById("cartItems").innerHTML = "";
    document.getElementById("cartTotal").textContent = "0";
    document.getElementById("customer-name").value = "";
    document.getElementById("customer-phone").value = "";
}

// Send WhatsApp Confirmation
async function sendOrderConfirmation(orderId, customerPhone) {
    console.log("✅ Sending WhatsApp confirmation...");

    if (!customerPhone.startsWith("+")) {
        customerPhone = `+91${customerPhone}`;
    }

    try {
        const response = await fetch('/api/sendMessage', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, customerPhone })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unknown error");

        console.log("✅ WhatsApp message sent successfully.");
    } catch (error) {
        console.error("❌ WhatsApp message error:", error);
        alert(`Error sending WhatsApp confirmation: ${error.message}`);
    }
}

(async function testFirestoreConnection() {
    try {
        if (!db) {
            console.error("Firestore is not initialized.");
            return;
        }

        const menuCollection = collection(db, "menu");
        const menuSnapshot = await getDocs(menuCollection);
        console.log("Firestore Connection Successful.");

        menuSnapshot.forEach(doc => {
            console.log(doc.id, " => ", doc.data());
        });
    } catch (error) {
        console.error("Firestore Connection Failed: ", error);
        alert("Firestore Connection Failed. Check console for details.");
    }
})();
