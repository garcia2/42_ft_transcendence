import { URLS } from "../app.js"

export function getTournamentUsers(tournamentId) {
    return fetch(URLS.API + '/tournaments/tournaments/' + tournamentId + '/users/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    }).then(result => result.json())
}

export function getTournaments() {
    return fetch(URLS.API + '/tournaments/tournaments/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    }).then(result => result.json())
}

export function getTournament(tournamentId) {
    return fetch(URLS.API + '/tournaments/tournaments/' + tournamentId + '/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    }).then(result => result.json())
}


export function joinTournament(currentUser, alias, tournamentId) {
    return fetch(URLS.API + '/tournaments/tournaments/' + tournamentId + '/participate/', {
        method: 'POST',
        body: JSON.stringify({
            "user_id": currentUser.id,
            "alias": alias
        }),
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    }).then(result => result.json())
}

export function quitTournament(currentUser, tournamentId) {
    return fetch(URLS.API + '/tournaments/tournaments/' + tournamentId + '/cancel_participation/', {
        method: 'POST',
        body: JSON.stringify({
            "user_id": currentUser.user_id,
            "alias": currentUser.alias
        }),
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    }).then(result => result.json())
}

export function deleteTournament(tournamentId) {
    return fetch(URLS.API + '/tournaments/tournaments/delete/' + tournamentId + '/', {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    })
}

export function getTournamentGames(tournamentId) {
    return fetch(URLS.API + '/tournaments/tournaments/' + tournamentId + '/games/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    }).then(result => result.json())
}

export function createTournamentGame(tournamentId, body) {
    if (!body) return new Promise((resolve) => resolve("finished"))
    return fetch(URLS.API + '/tournaments/tournaments/' + tournamentId + '/create_games/', {
        method: 'POST',
        body: JSON.stringify([body]),
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    })
}

export function createTournament(userId, name) {
    return fetch(URLS.API + '/tournaments/create/', {
        method: 'POST',
        body: JSON.stringify({
            organizer_id: userId,
            name: name
        }),
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    })
}

export function pathTournament(tournamentId, body) {
    return fetch(URLS.API + '/tournaments/tournaments/update/' + tournamentId + '/', {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    }).then(result => result.json())
}
