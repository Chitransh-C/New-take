export async function getFirebaseConfig() {
    try {
        const response = await fetch("/api/getFirebaseConfig");
        const config = await response.json();
        return config;
    } catch (error) {
        console.error("Failed to fetch Firebase config:", error);
        return null;
    }
}
