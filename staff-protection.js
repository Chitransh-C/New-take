import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, query, where, getDocs, collection } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

const auth = getAuth();
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";

import { firebaseConfig } from "./firebase-config.js";


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


function verifyAccess(requiredRole) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const email = user.email;

            // Query Firestore for the user's role
            const staffQuery = query(collection(db, "staff"), where("email", "==", email));
            const querySnapshot = await getDocs(staffQuery);

            if (!querySnapshot.empty) {
                const staffDoc = querySnapshot.docs[0];
                const staffData = staffDoc.data();

                // Check if the role matches the required role
                if (staffData.role !== requiredRole) {
                    alert("Access Denied! Redirecting to login.");
                    window.location.href = "staff-login.html";
                }
            } else {
                alert("No staff information found. Redirecting to login.");
                window.location.href = "staff-login.html";
            }
        } else {
            alert("User not authenticated. Redirecting to login.");
            window.location.href = "staff-login.html";
        }
    });
}

// Example: Call `verifyAccess` with the required role
//verifyAccess("admin");
