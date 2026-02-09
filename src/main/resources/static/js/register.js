function handleRegister(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const status = "offline";

    const user = {
        username: username,
        email: email,
        password: password,
        status: status
    };

    fetch('http://localhost:8080/api/v1/users/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
    }).then(response => {
        if (!response.ok) {
            alert("Registration failed. Please try again.");
            return response.text().then(text => { throw new Error(text) });
        }
        window.location.href = "login.html";
    }).catch(error => {
        console.error('Error:', error);
    });
}

const registrationForm = document.getElementById("registrationForm");
if (registrationForm) {
    registrationForm.addEventListener("submit", handleRegister);
}
