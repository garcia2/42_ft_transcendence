import { URLS } from "../app.js";
import {createTournamentGame} from "./tournament.service.js";

export function getGame(gameId) {
    return fetch(URLS.API + '/games/games/' + gameId + '/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    }).then(result => result.json())
}

export function createGame(user1_id, user2_id) {
    return fetch(URLS.API + '/games/create/', {
        method: 'POST',
        body: JSON.stringify({
            user1_id: user1_id,
            user2_id: user2_id
        }),
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    }).then(result => result.json())
}

export function patchGame(gameId, body) {
    return fetch(URLS.API + '/games/games/update/' + gameId + '/', {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    }).then(result => result.json())
}

export function startNextMatch(currentUser, tournamentId, tournamentUsers, tournamentGames) {
    let gameIndex = 1
    let gameBody = buildTree(tournamentUsers, tournamentGames)
        .flatMap(phase => phase.games)
        .map(games => mapGameStatus(tournamentGames, games))
        .filter(games => games.status !== 'completed')
        .map(games => {
            let round = {
                game: {
                    user1_id: games.games[0]?.user_id,
                    user2_id: games.games[1]?.user_id
                },
                round: gameIndex
            }
            gameIndex += 1
            return round
        })[0]

    return createTournamentGame(tournamentId, gameBody)
        .then(result => {
            if (result === "finished") return new Promise(resolve => resolve("finished"))
            return result.json()
        })
        .then(result => {
            if (result === "finished") return result
            return result.games[0]
        })
}

export function mapGameStatus(tournamentGames, games) {
    let result = {
        games: games,
        status: "upcoming"
    }

    let matchingGame = tournamentGames.find(g =>
        (g.user1_id === games[0]?.user_id && g.user2_id === games[1]?.user_id)
        || (g.user1_id === games[1]?.user_id && g.user2_id === games[0]?.user_id)
    )

    if (!!matchingGame && (matchingGame.score1 === 0 && matchingGame.score2 === 0)) {
        result.status = "ongoing"
    } else if (!!matchingGame && (matchingGame.score1 !== 0 || matchingGame.score2 !== 0)) {
        result.status = "completed"
    }

    return result
}

export function buildTree(tournamentUsers, tournamentGames, phaseNumber = 1, tree = [], leftOverUser = undefined) {
    if (tournamentUsers.length === 0) return []

    let users = phaseNumber === 1
        ? structuredClone(tournamentUsers)
        : tree[phaseNumber - 2]
            .games
            .map(games => {
                    if (!games || !games[0] || !games[1]) return undefined
                    let previousGame = tournamentGames.find(g => (g.user1_id === games[0].user_id && g.user2_id === games[1].user_id) || (g.user2_id === games[0].user_id && g.user1_id === games[1].user_id))

                    return !!previousGame && previousGame.score1 !== previousGame.score2
                        ? previousGame.score1 > previousGame.score2
                            ? tournamentUsers.find(user => user.user_id === previousGame.user1_id)
                            : tournamentUsers.find(user => user.user_id === previousGame.user2_id)
                        : undefined
                }
            )

    if (!!leftOverUser) users.push(leftOverUser)

    let currentRound = {
        index: phaseNumber,
        games: [],
    }

    let count = Math.floor(users.length / 2)

    for (let i = 0; i < count; i++) {
        let games = [...users.splice(0, 2)]
        currentRound.games.push(games)
    }

    tree.push(currentRound)

    if (currentRound.games.length >= 1) {
        buildTree(
            tournamentUsers,
            tournamentGames,
            phaseNumber + 1,
            tree,
            users.pop()
        )
    }

    return tree

}
