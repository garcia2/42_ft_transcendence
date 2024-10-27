import { URLS } from "../app.js";
import {setLoggedIn} from "./websocket.service.js";

export function getCurrentUser() {
    return fetch(URLS.API + '/users/me/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    })
}

export function getUser(userId) {
    return fetch(URLS.API + '/users/' + userId + '/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    })
}

export function listUsers() {
    return fetch(URLS.API + '/users/users/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    }).then(result => result.json())
}

export function getCurrentUserFriends() {
    return fetch(URLS.API + '/users/friends/get/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    }).then(result => result.json())
}

export function addFriend(friendId) {
    return fetch(URLS.API + '/users/friends/add/', {
        method: 'POST',
        body: JSON.stringify({
            friend_id: friendId
        }),
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    }).then(result => result.json())
}

export function removeFriend(friendId) {
    return fetch(URLS.API + '/users/friends/remove/', {
        method: 'DELETE',
        body: JSON.stringify({
            friend_id: friendId
        }),
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    }).then(result => result.json())
}

export function getUserGames(userId) {
    return fetch(URLS.API + '/games/user_games/' + userId + "/", {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    }).then(result => result.json())
}

export async function login(data) {
    return fetch(URLS.API + '/users/login/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(res => {
        setLoggedIn(data.nickname)
        return res
    });
}