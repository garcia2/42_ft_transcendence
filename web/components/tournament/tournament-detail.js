import loadPage from "../../utils/loadPage.js";
import {
    deleteTournament, getTournament, getTournamentGames, getTournamentUsers,
    joinTournament,
    quitTournament
} from "../../services/tournament.service.js";
import {getCurrentUser, getUser} from "../../services/user.service.js";
import {buildTree, getGame, mapGameStatus, startNextMatch} from "../../services/game.service.js";
import {sendGameInvite} from "../../services/invite.service.js";

export function setupTournamentDetailComponent(router) {
    router.routes['/tournaments/:id'] = {
        render: () => {
            return `
			<h1 class="title-text-color pt-5" id="page-title">Tournament information</h1>
			<h6 class="tertiary-text-color pt-1 pb-2 fst-italic" id="page-subtitle"></h6>
			<div class="d-flex flex-column align-items-center w-100" id=tournament-detail-main>
				<div class="spinner mt-5" role="status">
					<span class="visually-hidden">Loading...</span>
				</div>
			</div>
			`;
        },

        init: async () => initCard()

    };

    async function initCard() {
        document.getElementById("tournament-detail-main").innerHTML = await loadPage("/components/tournament/tournament-detail.html");
        let tournamentCard = document.getElementById("tournament-card")
        let tournamentCardHeader = document.createElement("div")
        let tournamentCardBody = document.createElement("div")
        tournamentCardBody.classList.add("tournament-card-body", "d-flex", "flex-row", "align-items-center", "pb-5", "w-100")

        let tournamentCardFooter = document.createElement("div")
        tournamentCardFooter.classList.add("d-flex", "justify-content-end", "w-100")

        let tournamentId = router.data["1"]

        Promise.all([
            getCurrentUser().then(result => result.json()),
            getTournament(tournamentId),
            getTournamentUsers(tournamentId),
            getTournamentGames(tournamentId)
                .then(tournamentGames => Promise.all(tournamentGames.map(g => getGame(g.game_id)))),
        ]).then(results => {
            let currentUser = results[0]
            let tournament = results[1]
            let tournamentUsers = results[2]
            let tournamentGames = results[3]

            generateCard(
                tournament,
                tournamentUsers,
                currentUser,
                tournamentGames,
                tournamentCardBody,
                tournamentCardFooter
            )

            tournamentCard.appendChild(tournamentCardHeader)
            tournamentCard.appendChild(tournamentCardBody)
            tournamentCard.appendChild(tournamentCardFooter)
        })
    }

    function generateCard(tournament, tournamentUsers, currentUser, tournamentGames, tournamentCardBody, tournamentCardFooter) {

        let pageTitle = document.getElementById('page-title')
        pageTitle.innerText = tournament.name

        getUser(tournament.organizer_id)
            .then(result => result.json())
            .then(organizer => {
                let pageTitle = document.getElementById('page-subtitle')
                pageTitle.innerText = "Organized by " + organizer.nickname
            })

        generateUserList(tournamentUsers, tournamentCardBody)
        generateGameTable(tournament, tournamentUsers, tournamentGames, tournamentCardBody)

        generateFooterButtons(tournament, tournamentUsers, tournamentGames, currentUser, tournamentCardFooter)
    }

    function generateFooterButtons(tournament, tournamentUsers, tournamentGames, currentUser, tournamentCardFooter) {
        const isUserInTournament = tournamentUsers.map(user => user.user_id).includes(currentUser.id)
        if (isUserInTournament && tournamentGames.length === 0 && tournament.status === "upcoming") {
            let quitButtonElement = document.createElement("button")
            quitButtonElement.classList.add("btn", "btn-tertiary", "primary-text-color", "w-25")
            quitButtonElement.innerText = "Quit tournament"
            quitButtonElement.onclick = () => quitTournament(tournamentUsers.find(tu => tu.user_id === currentUser.id), tournament.id)
                .then(_ => refreshCard())

            tournamentCardFooter.appendChild(quitButtonElement)
        } else if (!isUserInTournament && tournament.status === "upcoming") {

            let divAliasElement = document.createElement("div")
            divAliasElement.classList.add("input-group", "mb-3", "w-25")

            let aliasInputElement = document.createElement("input")
            aliasInputElement.type = "text"
            aliasInputElement.autocomplete = "off"
            aliasInputElement.placeholder = "alias"
            aliasInputElement.classList.add("form-control", "secondary-background-color", "default-text-color")

            let joinButtonElement = document.createElement("button")
            joinButtonElement.classList.add("btn", "btn-outline-secondary", "primary-text-color", "disabled")
            joinButtonElement.innerText = "Join tournament"
            joinButtonElement.onclick = () => joinTournament(currentUser, aliasInputElement.value, tournament.id)
                .then(_ => refreshCard())

            aliasInputElement.addEventListener("input", (event) => {
                if (event.target.value?.length < 2 || tournamentUsers.map(tu => tu.alias).includes(event.target?.value)) {
                    joinButtonElement.classList.add("disabled")
                } else {
                    joinButtonElement.classList.remove("disabled")
                }
            });

            divAliasElement.appendChild(aliasInputElement)
            divAliasElement.appendChild(joinButtonElement)
            tournamentCardFooter.appendChild(divAliasElement)
        }

        if (tournament['organizer_id'] === currentUser.id) {
            let deleteTournamentButton = document.createElement('button')
            deleteTournamentButton.classList.add("btn", "btn-tertiary", "primary-text-color", "w-25")
            deleteTournamentButton.innerText = 'Delete tournament'
            deleteTournamentButton.onclick = () => deleteTournament(tournament.id)
                .then(_ => router.navigate('/'))
            tournamentCardFooter.appendChild(deleteTournamentButton)
        }

        if (tournament['organizer_id'] === currentUser.id && tournamentGames.length === 0 && tournamentUsers.length > 1) {
            let startTournamentButton = document.createElement('button')
            startTournamentButton.classList.add("btn", "btn-primary", "primary-text-color", "w-25")
            startTournamentButton.innerText = "Start tournament"
            startTournamentButton.onclick = () => startNextMatch(currentUser, tournament.id, tournamentUsers, tournamentGames)
                .then(game => Promise.all([
                    sendGameInvite(game.code, {id: game.user1_id, nickname: tournament.name}, game.user2_id),
                    sendGameInvite(game.code, {id: game.user2_id, nickname: tournament.name}, game.user1_id)
                ]))
                .then(_ => refreshCard())
            tournamentCardFooter.appendChild(startTournamentButton)
        }
    }

    function generateUserList(users, body) {
        let container = document.createElement("div")
        container.classList.add("w-25")

        let title = document.createElement("h4")
        title.innerText = "Participants"
        container.appendChild(title)

        if (users.length === 0) {
            let subtitle = document.createElement("span")
            subtitle.classList.add("fst-italic", "tertiary-text-color")
            subtitle.innerText = "No participants yet"
            container.appendChild(subtitle)
        }

        for (let user of users) {
            let userRow = document.createElement("div")
            userRow.innerText = user.alias
            container.appendChild(userRow)
        }

        body.appendChild(container)
    }

    function generateGameTable(tournament, tournamentUsers, tournamentGames, body) {
        let container = document.createElement("div")
        container.classList.add("w-100", "d-flex", "flex-column", "align-items-center")

        let title = document.createElement("h4")
        title.innerText = 'Tournament rounds'
        container.appendChild(title)
        if (tournamentUsers.length <= 1) {

            let noMatchesSpan = document.createElement("span")
            noMatchesSpan.classList.add("fst-italic", "tertiary-text-color")
            noMatchesSpan.innerText = "There is no game planned for now, wait for players to join the tournament"
            container.appendChild(noMatchesSpan)
            body.appendChild(container)
            return
        }

        if (tournamentGames.length > 0 && tournament.status === 'finished') {
            let tournamentWinnerGame = tournamentGames.filter(g => g.completed).reverse()[0]
            if (!!tournamentWinnerGame) {
                let tournamentWinner = tournamentUsers.find(u =>
                    tournamentWinnerGame.score1 > tournamentWinnerGame.score2
                        ? u.user_id === tournamentWinnerGame.user1_id
                        : u.user_id === tournamentWinnerGame.user2_id
                )

                let tournamentWinnerElement = document.createElement('h4')
                tournamentWinnerElement.classList.add("primary-text-color", "w-100")
                tournamentWinnerElement.innerHTML = 'The winner of this tournament is : ' + tournamentWinner.alias + '<i class="fa-solid fa-trophy ps-2 tertiary-text-color"></i>'
                container.appendChild(tournamentWinnerElement)
            }
        }

        let tree = buildTree(structuredClone(tournamentUsers), tournamentGames)
        createTree(tree, tournamentGames, container)
        body.appendChild(container)
    }

    function buildSubTree(phases, tournamentGames, container, title) {
        if (phases.length === 0) return

        let table = document.createElement('table')
        table.classList.add("w-50")

        let thead = document.createElement('thead')
        let trHead = document.createElement('tr')

        let phaseColumn = document.createElement('th')
        phaseColumn.scope = 'col'
        phaseColumn.innerText = title

        trHead.appendChild(phaseColumn)
        thead.appendChild(trHead)
        table.appendChild(thead)

        let tbody = document.createElement('thead')

        for (let phase of phases) {
            let tournamentGame = tournamentGames.find(g => (g.user1_id === phase.games[0]?.user_id && g.user2_id === phase.games[1]?.user_id) || (g.user2_id === phase.games[0]?.user_id && g.user1_id === phase.games[1]?.user_id))

            let tr = document.createElement('tr')
            let phaseRow = document.createElement('td')
            phaseRow.classList.add("border-bottom")
            phaseRow.innerHTML =
                (phase.games[0]?.alias ?? "not determined yet")
                + (tournamentGame?.completed
                        ? tournamentGame?.score1 > tournamentGame?.score2
                            ? '<i class="fa-solid fa-check text-success ms-1"></i>'
                            : '<i class="fa-solid fa-xmark text-danger ms-1"></i>'
                        : ''
                )
                + " vs "
                + (phase.games[1]?.alias ?? "not determined yet")
                + (tournamentGame?.completed
                        ? tournamentGame?.score1 < tournamentGame?.score2
                            ? '<i class="fa-solid fa-check text-success ms-1"></i>'
                            : '<i class="fa-solid fa-xmark text-danger ms-1"></i>'
                        : ''
                )
            tr.appendChild(phaseRow)
            tbody.appendChild(tr)

        }


        table.appendChild(tbody)
        container.appendChild(table)
    }


    function createTree(tree, tournamentGames, container) {
        let flatTree = structuredClone(tree)
            .flatMap(phase => phase.games)
            .map(games => mapGameStatus(tournamentGames, games))

        let completedPhases = flatTree.filter(phase => phase.status === "completed")
        let ongoingPhases = flatTree.filter(phase => phase.status === "ongoing")
        let upcomingPhases = flatTree.filter(phase => phase.status === "upcoming")

        buildSubTree(completedPhases, tournamentGames, container, 'Finished games')
        buildSubTree(ongoingPhases, tournamentGames, container, 'Ongoing game')
        buildSubTree(upcomingPhases, tournamentGames, container, 'Upcoming games')
    }


    function refreshCard() {
        initCard().then()
    }

}