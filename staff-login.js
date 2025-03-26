import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

// ✅ Firebase Initialization
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ✅ Handle Login
document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
        // ✅ Step 1: Authenticate User with Firebase Authentication
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // ✅ Step 2: Fetch Staff Role from Firestore
        const staffQuery = query(collection(db, "staff"), where("email", "==", email));
        const querySnapshot = await getDocs(staffQuery);

        if (!querySnapshot.empty) {
            const staffDoc = querySnapshot.docs[0];
            const staffData = staffDoc.data();

            // ✅ Step 3: Redirect Based on Role
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
