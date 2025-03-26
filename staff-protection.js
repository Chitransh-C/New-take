import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, query, where, getDocs, collection } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";

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

// Function to verify access
function verifyAccess(requiredRole) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            alert("User not authenticated. Redirecting to login.");
            window.location.href = "staff-login.html";
            return;
        }

        const email = user.email;
        const staffQuery = query(collection(db, "staff"), where("email", "==", email));
        const querySnapshot = await getDocs(staffQuery);

        if (!querySnapshot.empty) {
            const staffDoc = querySnapshot.docs[0];
            const staffData = staffDoc.data();

            if (staffData.role !== requiredRole) {
                alert("Access Denied! Redirecting to login.");
                window.location.href = "staff-login.html";
            }
        } else {
            alert("No staff information found. Redirecting to login.");
            window.location.href = "staff-login.html";
        }
    });
}
