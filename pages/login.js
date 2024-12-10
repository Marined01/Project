document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const username = document.getElementById('username').value; 
    const password = document.getElementById('password').value; 

    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }) 
    });

    if (response.ok) {
        window.location.href = '/main.html'; 
    } else {
        alert('Login failed. Please check your credentials.'); 
    }
});
