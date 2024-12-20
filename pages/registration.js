document.getElementById('registration-form').addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const username = document.getElementById('username').value; 
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message'); 

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, password })
        });

        const result = await response.json();

        if (response.ok) {
            messageDiv.textContent = result.message || 'Registration successful!';
            messageDiv.style.color = 'green';
            window.location = "login.html"
        } else {
            messageDiv.textContent = result.error || 'Registration failed. Please try again.';
            messageDiv.style.color = 'red';
        }
    } catch (error) {
        
        messageDiv.textContent = 'Server error, please try again later.';
        messageDiv.style.color = 'red';
    }
});
