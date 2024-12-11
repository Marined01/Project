document.getElementById('registration-form').addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const username = document.getElementById('username').value; 
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message'); 

    try {
        const response = await fetch('/registration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, password })
        });

        const result = await response.json();

        if (response.ok) {
            messageDiv.textContent = result.message || 'Registration successful!';
            messageDiv.style.color = 'green';

            const loginPageResponse = await fetch('/login', {
                method: 'GET',
                headers: { 'Content-Type': 'text/html' }
            });

            if (loginPageResponse.ok) {
                const loginPageHtml = await loginPageResponse.text();
                document.body.innerHTML = loginPageHtml; // Замінюємо поточний контент сторінки
            } else {
                messageDiv.textContent = 'Failed to load login page. Please try again.';
                messageDiv.style.color = 'red';
            }
        } else {
            
            messageDiv.textContent = result.error || 'Registration failed. Please try again.';
            messageDiv.style.color = 'red';
        }
    } catch (error) {
        
        messageDiv.textContent = 'Server error, please try again later.';
        messageDiv.style.color = 'red';
    }
});
