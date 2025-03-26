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
    let customerName = document.getElementById("customer-name").value.trim();
    let customerPhone = document.getElementById("customer-phone").value.trim();
    let cartItems = JSON.parse(localStorage.getItem("cart")) || [];

    if (!customerPhone.match(/^\d{10}$/)) {
        alert("Please enter a valid 10-digit phone number.");
        return;
    }

    if (cartItems.length === 0) {
        alert("Your cart is empty. Add items before proceeding.");
        return;
    }

    // ✅ Get Current Date Details
    const now = new Date();
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const month = months[now.getMonth()];
    const date = now.getDate().toString().padStart(2, "0");
    const year = now.getFullYear().toString().slice(-2);

    try {
        // ✅ Check Firestore for last used number today
        if (!db) {
    alert("Firestore is not initialized. Please try again later.");
    return;
}
const orderCounterRef = doc(db, "orderCounters", `${month}${date}${year}`);

        const orderCounterSnap = await getDoc(orderCounterRef);
        let lastNumber = orderCounterSnap.exists() ? orderCounterSnap.data().lastUsedNumber : 1000;

        // ✅ Generate Next Unique Order Number for Today
        let uniqueNumber = lastNumber + 1;
        let orderId = `ORD${month}${date}${year}${uniqueNumber}`;

        // ✅ Save the updated last used number in Firestore
        await setDoc(orderCounterRef, { lastUsedNumber: uniqueNumber });

        // ✅ Save order to Firestore with custom Order ID
        await addDoc(collection(db, "orders"), {
            orderId: orderId,
            customer: customerName || "Guest",
            phone: customerPhone,
            items: cartItems,
            status: "New",
            timestamp: serverTimestamp()
        });
        console.log('✅ Order saved to Firestore. Calling sendOrderConfirmation...');
//alert('Order placed! Sending WhatsApp confirmation...');

// ✅ Call WhatsApp Confirmation Function
await sendOrderConfirmation(orderId, customerPhone);

        // ✅ Show the custom Order ID to the user
        alert(`Order placed successfully! 🎉\nYour Order ID: ${orderId}`);

        // ✅ Clear cart after checkout
        localStorage.removeItem("cart");
        document.getElementById("cartItems").innerHTML = "";
        document.getElementById("cartTotal").textContent = "0";
        document.getElementById("customer-name").value = "";
        document.getElementById("customer-phone").value = "";
    } catch (error) {
        console.error("Error adding order: ", error);
        alert("Something went wrong.");
    }
}

// ✅ Test Firestore Connection


// ✅ Send WhatsApp Confirmation After Order is Placed
// ✅ Send WhatsApp Confirmation After Order is Placed
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
