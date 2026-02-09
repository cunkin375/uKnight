const logoutBtn = document.getElementById("logoutBtn");
const newMeetingBtn = document.getElementById("newMeetingBtn");
const joinMeetingBtn = document.getElementById("joinMeetingBtn");
const meetingNameInput = document.getElementById("meetingName");

window.addEventListener("load", () => {

    const connectedUser = JSON.parse(localStorage.getItem('connectedUser'));
    if (!connectedUser) {
        window.location.href = 'login.html';
    }

    const userListElement = document.getElementById('userList');
    userListElement.innerHTML = 'Loading...';
    fetch('http://localhost:8080/api/v1/users', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        return response.json();
    }).then((data) => {
        console.log(data);
        displayUsers(data, userListElement);
    }).catch(error => {
        console.error('Error:', error);
    });
});

function displayUsers(userList, userListElement) {
    userListElement.innerHTML = "";
    userList.forEach(user => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <div>
                <i class="fa fa-user-circle"></i>
                ${user.username} <i class="user-email">(${user.email})</i>
            </div>
            <i class="fa fa-lightbulb-o ${user.status === "online" ? "online" : "offline"}"></i>
        `;
        userListElement.appendChild(listItem);
    });
}

logoutBtn.addEventListener("click", () => {
    fetch('http://localhost:8080/api/v1/users/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: localStorage.getItem('connectedUser')
    }).then(response => {
        if (!response.ok) {
            throw new Error('Failed to logout');
        }
        localStorage.removeItem('connectedUser');
        window.location.href = 'login.html';
    }).catch(error => {
        console.error('Error:', error);
    });
});

newMeetingBtn.addEventListener("click", () => {
    const meetingId = Math.random().toString(36).substring(2, 10);
    window.location.href = `videocall.html?meetingId=${meetingId}&mode=create`;
});

joinMeetingBtn.addEventListener("click", () => {
    const meetingId = meetingNameInput.value.trim();
    if (meetingId) {
        window.location.href = `videocall.html?meetingId=${meetingId}&mode=join`;
    } else {
        alert("Please enter a Meeting ID");
    }
});