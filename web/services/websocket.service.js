const socket = new WebSocket('wss://localhost:1500/ws/presence')
let currentUsername = null

socket.onopen = _ => {
    if (currentUsername) setLoggedIn(currentUsername)

    console.log("connected to socket")
}

socket.onmessage = e => {
    localStorage.setItem("loggedInUserList", e.data)
}

export function setLoggedOut() {
    socket.send(JSON.stringify({
        'action': 'REMOVE',
        'username': currentUsername
    }))
    currentUsername = null
}

export function setLoggedIn(username) {
    currentUsername = username
    socket.send(JSON.stringify({
        'action': 'ADD',
        'username': currentUsername
    }))
}