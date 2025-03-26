import { 
    initializeApp 
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";

import { 
    getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

import { 
    getFirestore, collection, doc, getDocs, setDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

let auth = null;
let db = null;

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

// ✅ Initialize Firebase dynamically after fetching credentials
document.addEventListener("DOMContentLoaded", async () => {
    console.log("🔄 Fetching Firebase credentials...");
    const firebaseConfig = await getFirebaseConfig(); // Fetch from backend

    if (!firebaseConfig) {
        alert("Failed to load Firebase. Please try again later.");
        return;
    }

    // ✅ Initialize Firebase only after fetching credentials
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("✅ Firebase initialized securely.");

    // ✅ Call authentication check after Firebase is initialized
    
checkAuthState();
    // ✅ Attach event listeners only after Firebase is ready
    setTimeout(() => {
        attachEventListeners();
        
    }, 500); 
    // Small delay
});

// ✅ Authentication State Check
function checkAuthState() {
    if (!auth) {
        console.error("❌ Firebase is not initialized. Cannot check authentication.");
        return;
    }

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            alert("Unauthorized access!");
            window.location.href = "staff-login.html";
            return;
        }

        console.log("✅ User authenticated:", user.email);
        loadMenu();
        loadStaff();
    });
}

// ✅ Function to attach event listeners after Firebase is initialized
function attachEventListeners() {
    // Logout button event listener
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            if (!auth) {
                console.error("❌ Firebase is not initialized. Logout failed.");
                alert("Logout failed. Please try again.");
                return;
            }

            try {
                alert("Logging Out...");
                await signOut(auth);
                console.log("✅ User successfully signed out.");
                window.location.href = "index.html";
            } catch (error) {
                console.error("❌ Error during logout:", error.message);
                alert("Logout failed. Please try again.");
            }
        });
    } else {
        console.error("❌ Logout button not found in the DOM.");
    }
    
    
    
// Add menu item
document.getElementById("add-menu-item").addEventListener("click", async () => {

if (!db) {
        console.error("❌ Firestore is not initialized.");
        alert("Cannot add menu item. Firestore is not initialized.");
        return;
    }
    const name = document.getElementById("menu-item-name").value;
    const price = parseFloat(document.getElementById("menu-item-price").value);
    const category = document.getElementById("menu-item-category").value;

    if (!name || isNaN(price) || !category) {
        alert("Please fill out all fields!");
        return;
    }

    await setDoc(doc(collection(db, "menu")), { name, price, available: true, category });
    loadMenu();
});



    // Attach event listener for adding new staff
    const addStaffBtn = document.getElementById("add-staff-btn");
    if (addStaffBtn) {
        addStaffBtn.addEventListener("click", async () => {
            if (!auth || !db) {
                console.error("❌ Firebase is not initialized.");
                return;
            }

            const email = document.getElementById("staff-email").value.trim();
            const password = document.getElementById("staff-password").value.trim();
            const role = document.getElementById("staff-role").value;
            const name = document.getElementById("staff-name").value.trim();

            if (!email || !password || !role || !name) {
                alert("Please fill out all fields: email, password, role, and name.");
                return;
            }

            try {
                // ✅ Create a new user in Firebase Authentication
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const uid = userCredential.user.uid;

                // ✅ Add the user's details to Firestore `staff` collection
                await setDoc(doc(db, "staff", uid), {
                    email,
                    role,
                    name,
                    uid,
                });

                alert(`Staff member ${name} added successfully!`);
                loadStaff(); // Refresh staff list
            } catch (error) {
                if (error.code === 'auth/email-already-in-use') {
                    alert("This email is already associated with an account.");
                } else if (error.code === 'auth/weak-password') {
                    alert("Password must be at least 6 characters.");
                } else {
                    alert(`Failed to add staff: ${error.message}`);
                }
                console.error("❌ Error adding staff:", error);
            }
        });
    }
}

// ✅ Load Menu
async function loadMenu() {
    if (!db) {
        console.error("❌ Firestore is not initialized.");
        return;
    }

    console.log("🔄 Loading menu data...");
    const menuRef = collection(db, "menu");
    const menuSnap = await getDocs(menuRef);
    const menuList = document.getElementById("menu-list");

    menuList.innerHTML = "";
    menuSnap.forEach(doc => {
        const menuItem = doc.data();
        menuList.innerHTML += `
            <tr>
                <td>${menuItem.name}</td>
                <td>₹${menuItem.price}</td>
                <td>${menuItem.category || "Uncategorized"}</td> 
                <td>
                    <label class="switch"> 
                        <input type="checkbox" ${menuItem.available ? "checked" : ""} onclick="toggleAvailability('${doc.id}', this.checked)"> 
                        <span class="slider round"></span> 
                    </label>
                </td>
                <td>
                    <button onclick="updateMenu('${doc.id}')">Edit</button>
                    <button onclick="deleteMenu('${doc.id}')">Delete</button>
                </td>
            </tr>
        `;
    });
}

// ✅ Load Staff
async function loadStaff() {
    if (!db) {
        console.error("❌ Firestore is not initialized.");
        return;
    }

    console.log("🔄 Loading staff data...");
    const staffRef = collection(db, "staff");
    const staffSnap = await getDocs(staffRef);
    const staffList = document.getElementById("staff-list");

    staffList.innerHTML = "";
    staffSnap.forEach(doc => {
        const staff = doc.data();
        staffList.innerHTML += `
            <tr>
                <td>${staff.email}</td>
                <td>${staff.role}</td>
                <td>
                    <button onclick="deleteStaff('${doc.id}')">Remove</button>
                </td>
            </tr>
        `;
    });
}

// ✅ Toggle Availability of Menu Item
window.toggleAvailability = async function (menuId, isAvailable) {
    if (!db) {
        console.error("❌ Firestore is not initialized.");
        return;
    }

    try {
        console.log(`Toggling availability for ${menuId} to ${isAvailable}`);
        const menuRef = doc(db, "menu", menuId);
        await setDoc(menuRef, { available: isAvailable }, { merge: true });

        console.log("✅ Availability updated successfully.");
    } catch (error) {
        console.error("❌ Error updating availability:", error);
        alert("Failed to update availability. Please try again.");
    }
};

// ✅ Delete Staff
window.deleteStaff = async function (staffId) {
    if (!db) {
        console.error("❌ Firestore is not initialized.");
        return;
    }

    try {
        console.log("Attempting to remove staff with ID:", staffId);
        await deleteDoc(doc(db, "staff", staffId));

        alert("Staff member removed successfully!");
        loadStaff();
    } catch (error) {
        console.error("❌ Error removing staff:", error.message);
        alert("Failed to remove staff. Please try again.");
    }
};

// ✅ Section Switch
window.showSection = function (sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
};
