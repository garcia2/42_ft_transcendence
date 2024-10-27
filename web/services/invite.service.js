import { URLS } from "../app.js"

export function getUserInvites(userId) {
    return fetch(URLS.API + '/invites/invites/' + userId + '/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    }).then(result => result.json())
}

export function deleteInvite(inviteId) {
    return fetch(URLS.API + '/invites/delete_invite/', {
        method: 'DELETE',
        body: JSON.stringify({
            invitation_id: inviteId
        }),
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    })
}

export function sendGameInvite(code, inviter, inviteeId) {
    return fetch(URLS.API + '/invites/invite/', {
        method: 'POST',
        body: JSON.stringify({
            inviter_id: inviter.id,
            invitee_id: inviteeId,
            timestamp: new Date().getDate(),
            message: "You have been invited by " + inviter.nickname + " to play a game of pong. Use this code to log in to the game : '" + code + "'."
        }),
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    }).then(result => result.json())
}