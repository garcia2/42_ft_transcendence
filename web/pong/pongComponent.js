import loadPage from "../utils/loadPage.js";
import {setupPongGame} from "./main.js";
import {isConnected} from "../components/loginComponents/loginComponents.js";
import {getCurrentUser, getCurrentUserFriends, getUserGames, listUsers} from "../services/user.service.js";
import {createGame, getGame, patchGame, startNextMatch} from "../services/game.service.js";
import {
    getTournamentGames,
    getTournaments,
    getTournamentUsers,
    pathTournament
} from "../services/tournament.service.js";
import {sendGameInvite} from "../services/invite.service.js";

export function setupPongComponent(router) {
    router.routes['/game'] = {
        render: () => {
            return `
				<h1 class="title-text-color pt-5">Let's play PONG</h1>
				<div class="d-flex flex-column align-items-center w-100" id=pong-main>
					<div class="spinner mt-5" role="status">
						<span class="visually-hidden">Loading...</span>
					</div>
				</div>
			`;
        },
        init: async () => {
            const isLoggedIn = await isConnected();
            const currentUser = await getCurrentUser().then(result => result.json());
            const users = !currentUser.error ? await listUsers() : null;

            setupGameModeOptionsPage()
                .then(_ => {
                    // Basic game mode, local, with no invite, no game created in database...
                    document.getElementById('basic-game-play-button')
                        .onclick = () => setupGameSettingsPage("default");

                    // A game with a friend, your friend will come to your local setup
                    // but the game will be created in the database and show in your profile

                    setupGameAndFriendList(isLoggedIn, currentUser, users).then()
                })
        }
    };

    async function setupGameAndFriendList(isLoggedIn, currentUser, users) {

        if (!isLoggedIn) {
            document.getElementById('tournaments-container').classList.add('d-none')
            document.getElementById('friends-container').classList.add('d-none')
            return
        }

        const friendListElement = document.getElementById('friend-list');
        const gameListElement = document.getElementById('game-list');
        const tournamentGameElement = document.getElementById('tournament-game-list');

        friendListElement.innerHTML = 'No friends'
        gameListElement.innerHTML = 'No ongoing games'
        tournamentGameElement.innerHTML = 'No ongoing tournament games'

        let friendList = []
        let userGames = []
        let userTournamentGames = []
        let tournamentGameUsers = []

        let games = await getUserGames(currentUser.id);

        let friendsResponse = await getCurrentUserFriends();
        friendList = friendsResponse.friends

        let tournaments = await getTournaments()
        for (let t of tournaments) {
            t.users = await getTournamentUsers(t.id);
            t.games = await getTournamentGames(t.id)
                .then(res => res.map(r => games.find(g => g.id === r.game_id)))
        }

        userTournamentGames = tournaments
            .map(t => {
                t.games.filter(g => !!g).forEach(g => g.tournamentId = t.id)
                return t.games;
            })
            .flat()
            .filter(g => !!g)
            .filter(g => !g.completed)


        tournamentGameUsers = tournaments.map(t => t.users).flat()

        userGames = games
            .filter(g => !userTournamentGames.map(g => g.id).includes(g.id))
            .filter(g => !g.completed)

        if (friendList.length > 0) {
            friendListElement.innerHTML = ''
            friendList.forEach(friend => {
                let friendElement = document.createElement('div')

                friendElement.innerHTML = `<div class="w-100 pointer appear-on-hover">${friend.nickname} <span class="text-success">invite to play</span></div>`

                friendElement.onclick = () => {
                    if (userGames.filter(g => (g.user1_id === currentUser.id && g.user2_id === friend.id)
                        || (g.user1_id === friend.id && g.user2_id === currentUser.id)).length === 0) {
                        createGame(currentUser.id, friend.id).then(createdGame => {
                            setupGameAndFriendList(isLoggedIn, currentUser, users).then()
                            let inviteeId = currentUser.id === createdGame.user1_id
                                ? createdGame.user2_id
                                : createdGame.user1_id

                            sendGameInvite(createdGame.code, currentUser, inviteeId)
                        })
                    } else {
                        let errorList = document.getElementsByClassName("ongoing-game-error")
                        for (let i = 0; i < errorList.length; i++) {
                            friendElement.removeChild(errorList.item(0))
                        }

                        let error = document.createElement('span')
                        error.classList.add("ongoing-game-error", "fst-italic", "text-danger")
                        error.innerText = 'There is already an ongoing game with this friend'
                        friendElement.appendChild(error)
                    }
                }
                friendListElement.appendChild(friendElement)
            })

            setupGameList("friend", userGames, users, currentUser, gameListElement)
        }
        setupGameList("tournament", userTournamentGames, users, currentUser, tournamentGameElement, tournamentGameUsers)
    }

    function setupGameList(mode, gameList, users, currentUser, container, aliases = null) {

        if (gameList.length > 0) {
            container.innerHTML = ''
            let i = 0;
            gameList.forEach(game => {
                let gameElement = document.createElement('div')
                gameElement.classList.add('d-flex', 'flex-column', 'text-start')


                console.log(aliases)

                let gamePlayersElement = document.createElement('div')

                

                let user1 = users.find(u => u.id === game.user1_id)
                let user2 = users.find(u => u.id === game.user2_id)

                let user1Name = aliases[i].alias;
                let user2Name = aliases[i + 1].alias
                
                i = i + 2;


                gamePlayersElement.innerHTML = `<span>${user1Name} vs ${user2Name}</span>`

                gameElement.appendChild(gamePlayersElement)

                // Opponent  credentials
                let opponentLoginForm = document.createElement('form')
                opponentLoginForm.classList.add("w-100")

                let inputGroupDiv = document.createElement('div')
                inputGroupDiv.classList.add('mb-3', 'd-flex')

                let codeInput = document.createElement('input')
                codeInput.classList.add("custom-input-border", "primary-background-color", "default-text-color")
                codeInput.placeholder = 'Invite code'

                let playButton = document.createElement('button')
                playButton.innerText = 'Play'
                playButton.classList.add("ms-3", "btn", "btn-outline-secondary", "primary-text-color", "disabled")
                playButton.onclick = event => {
                    event.preventDefault()

                    if (codeInput.value === game.code) {
                        setupGameSettingsPage(mode, game.tournamentId, game.id, user1Name, user2Name).then()
                    }

                }

                codeInput.addEventListener("input", () => {
                    if (codeInput.value.length === 6) {
                        playButton.classList.remove("disabled")
                    } else {
                        playButton.classList.add("disabled")
                    }
                });

                inputGroupDiv.appendChild(codeInput)

                inputGroupDiv.appendChild(playButton)

                opponentLoginForm.appendChild(inputGroupDiv)
                gameElement.appendChild(opponentLoginForm)
                container.appendChild(gameElement)
            })
        }
    }

    document.getElementById('nav-pong').addEventListener('click', (e) => {
        e.preventDefault();
        router.navigate('/game');
    });

    async function setupGameModeOptionsPage() {
        const container = document.getElementById('pong-main');
        container.innerHTML = await loadPage("/pong/pong-game-mode-options-component.html");
    }

    async function setupGameSettingsPage(mode, tournamentId, gameId, player1, player2) {
        const container = document.getElementById('pong-main');
        container.innerHTML = await loadPage("/pong/pong-game-settings-component.html");

		const pongSettingsForm = document.getElementById("pong-settings-form");

		// Fonction pour gérer l'ajout/suppression des classes
		function updateFormWidth() {
			const screenWidth = window.innerWidth;

			// Retirer toutes les classes de largeur avant d'en ajouter une
			pongSettingsForm.classList.remove('w-25', 'w-50', 'w-100');

			// Ajouter la classe en fonction de la taille de l'écran
			if (screenWidth > 1300) {
				pongSettingsForm.classList.add('w-25');
			} else if (screenWidth > 600 && screenWidth <= 1300) {
				pongSettingsForm.classList.add('w-50');
			} else {
				pongSettingsForm.classList.add('w-100');
			}
		}

		// Appeler la fonction au chargement de la page et lors du redimensionnement de la fenêtre
		window.addEventListener('resize', updateFormWidth);
		window.addEventListener('load', updateFormWidth);
				
        document.getElementById('settings-play-button').onclick = async (event) => {
            event.preventDefault()
            await setupPongGamePage({
                playerLeftName: player1 ?? "Player 1",
                playerRightName: player2 ?? "Player 2",
                playerSize: document.querySelector('input[name="player-size"]:checked').value,
                colorSet: parseInt(document.querySelector('input[name="color-set"]:checked').value),
                ballSpeed: document.querySelector('input[name="ball-speed"]:checked').value,
                speedIncreaseMode: document.querySelector('input[name="ball-speed-increase"]:checked').value,
                scoreLimit: parseInt(document.getElementById('score-dropdown').value),
                gameMode: mode,
                gameId: gameId,
                tournamentId: tournamentId
            })
        }

        document.getElementById("score-dropdown").addEventListener("keydown", e => e.preventDefault());
    }

    async function setupPongWinnerPage(gameResult) {
        const container = document.getElementById('pong-main');
        container.innerHTML = await loadPage("/pong/pong-winner-display-component.html");

        let winnerDisplayElement = document.getElementById("winner-display")
        winnerDisplayElement.innerText = "Congratulations " + gameResult.winner + ", you won."

        let playAgainButtonElement = document.getElementById("play-again-button")
        playAgainButtonElement.onclick = () => router.navigate('/game')

        let homeButtonElement = document.getElementById("home-button")
        homeButtonElement.onclick = () => router.navigate('/')
    }

    async function setupPongGamePage(data) {
        const container = document.getElementById('pong-main');
        container.innerHTML = await loadPage("/pong/pong-content.html");

        setupPongGame(data).then(async gameResult => {

            if (gameResult.rules.gameMode === 'friend') {
                await patchGame(
                    gameResult.rules.gameId,
                    {
                        "score1": gameResult.scoreLeft,
                        "score2": gameResult.scoreRight,
                        "completed": true
                    }
                )
            } else if (gameResult.rules.gameMode === 'tournament') {
                await finishTournamentGame(gameResult)
            }

            setupPongWinnerPage(gameResult).then()
        });
    }

    async function finishTournamentGame(gameResult) {
        let tournamentId = gameResult.rules.tournamentId
        let currentUser = await getCurrentUser().then(result => result.json())
        let tournamentUsers = await getTournamentUsers(tournamentId)

        let tournamentGames = await getTournamentGames(tournamentId)
            .then(tournamentGames => Promise.all(tournamentGames.map(g => getGame(g.game_id))))
        let firstUncompletedGame = tournamentGames.find(g => !g.completed)

        if (!!firstUncompletedGame) {
            patchGame(
                firstUncompletedGame.id,
                {
                    "score1": gameResult.scoreLeft,
                    "score2": gameResult.scoreRight,
                    "completed": true
                }
            )
                .then(_ => getTournamentGames(tournamentId))
                .then(res => Promise.all(res.map(g => getGame(g.game_id))))
                .then(res => tournamentGames = res)
                .then(_ => startNextMatch(currentUser, tournamentId, tournamentUsers, tournamentGames))
                .then(game => {
                    if (game === "finished") {
                        finishTournament(tournamentId)
                    } else {
                        return Promise.all([
                            sendGameInvite(game.code, {id: game.user1_id, nickname: "tournament"}, game.user2_id),
                            sendGameInvite(game.code, {id: game.user1_id, nickname: "tournament"}, game.user1_id)
                        ])
                    }
                });
        } else {
            finishTournament(tournamentId)
        }
    }

    function finishTournament(tournamentId) {
        pathTournament(
            tournamentId,
            {
                status: "finished"
            }
        ).then()
    }
}
