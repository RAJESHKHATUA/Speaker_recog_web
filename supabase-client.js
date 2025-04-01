// Supabase Configuration
const supabaseUrl = 'https://rnrcqwcahkzawucexsym.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucmNxd2NhaGt6YXd1Y2V4c3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMDI4MTIsImV4cCI6MjA1ODg3ODgxMn0.1eH8s-Y2Rt6E2qv4G-8Dc3YClXIw4PqY84A4-PqIjtw';
const bucketName = 'uploads';

// Initialize Supabase client
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false
    }
});

// Test connection immediately
(async function checkConnection() {
    const statusBanner = document.getElementById('connectionStatus');
    
    try {
        // Test with a simple storage operation
        const { error } = await supabase.storage
            .from(bucketName)
            .upload('.connection-test', new Blob(['test']), {
                upsert: true
            });
        
        if (error && error.message !== 'The resource already exists') throw error;
        
        statusBanner.textContent = "✓ Connected to voice storage";
        statusBanner.className = "status-banner success";
    } catch (error) {
        console.error("Connection error:", error);
        statusBanner.innerHTML = `
            <div class="warning">
                ⚠️ Cloud storage unavailable - recordings will be saved locally
                <button onclick="location.reload()">Retry</button>
            </div>
        `;
    }
})();