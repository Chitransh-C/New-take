import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

let auth = null;
let db = null;

// Function to Fetch Firebase Config from Backend
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

// Initialize Firebase dynamically
document.addEventListener("DOMContentLoaded", async () => {
    const firebaseConfig = await getFirebaseConfig();
    if (!firebaseConfig) {
        alert("Failed to load Firebase. Please try again later.");
        return;
    }

    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("✅ Firebase initialized securely.");
});

// Handle Login
document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
        if (!auth || !db) {
            alert("Firebase not initialized. Please try again later.");
            return;
        }

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const staffQuery = query(collection(db, "staff"), where("email", "==", email));
        const querySnapshot = await getDocs(staffQuery);

        if (!querySnapshot.empty) {
            const staffDoc = querySnapshot.docs[0];
            const staffData = staffDoc.data();

            const role = staffData.role;
            if (role === "admin") {
                window.location.href = "admin.html";
            } else if (role === "chef") {
                window.location.href = "chef.html";
            } else if (role === "delivery") {
                window.location.href = "delivery.html";
            } else {
                alert("Invalid role. Contact the administrator.");
            }
        } else {
            alert("No role information found for this user. Contact the administrator.");
        }
    } catch (error) {
        console.error("Login Error:", error.message);
        alert("Invalid email or password. Please try again.");
    }
});
