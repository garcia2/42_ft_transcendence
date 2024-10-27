import loadPage from "../../utils/loadPage.js";
import {isConnected} from "../loginComponents/loginComponents.js";
import {
    createTournament,
    getTournaments,
    getTournamentUsers
} from "../../services/tournament.service.js";
import {getCurrentUser} from "../../services/user.service.js";

export function setupTournamentsComponent(router) {
    router.routes['/tournaments'] = {
        render: () => {
            return `
			<h1 class="title-text-color pt-5">Tournaments</h1>
			<div class="d-flex flex-column align-items-center w-50 primary-background-color p-3 rounded" id=tournament-main>
				<div class="spinner mt-5" role="status">
					<span class="visually-hidden">Loading...</span>
				</div>
			</div>
			`;
        },

        init: async () => {
            await refreshList()
        }
    };
    document.getElementById('nav-tournaments').addEventListener('click', (e) => {
        e.preventDefault();
        router.navigate('/tournaments');
    });

    function handleTournamentList(currentUser, tournaments) {

        const tournamentListComponent = document.getElementById("tournament-list");
        tournamentListComponent.innerHTML = ''

        Promise.all(tournaments.map(t => getTournamentUsers(t.id)
            .then(users => new Promise(resolve => resolve({
                tournament: t,
                users: users
            })))
        )).then(results => {

            let currentUserTournamentsSubtitle = document.createElement("h3")
            currentUserTournamentsSubtitle.innerText = "My tournaments"
            tournamentListComponent.appendChild(currentUserTournamentsSubtitle)
            buildSubTournamentList(
                results.filter(t => t.tournament['organizer_id'] === currentUser.id),
                tournamentListComponent
            )

            tournamentListComponent.appendChild(document.createElement("hr"))

            let currentUserJoinedTournamentsSubtitle = document.createElement("h3")
            currentUserJoinedTournamentsSubtitle.innerText = "Joined Tournaments"
            tournamentListComponent.appendChild(currentUserJoinedTournamentsSubtitle)
            buildSubTournamentList(
                results.filter(res => res.tournament['organizer_id'] !== currentUser.id && res.users.map(u => u.user_id).includes(currentUser.id)),
                tournamentListComponent
            )

            tournamentListComponent.appendChild(document.createElement("hr"))

            let tournamentsSubtitle = document.createElement("h3")
            tournamentsSubtitle.innerText = "Tournaments"
            tournamentListComponent.appendChild(tournamentsSubtitle)
            buildSubTournamentList(
                results.filter(res => res.tournament['organizer_id'] !== currentUser.id && !res.users.map(u => u.user_id).includes(currentUser.id)),
                tournamentListComponent
            )

            tournamentListComponent.appendChild(document.createElement("hr"))
        }).then(_ => {
            let divTournamentNameElement = document.createElement("div")
            divTournamentNameElement.classList.add("input-group", "mb-3", "w-100")

            let tournamentNameInputElement = document.createElement("input")
            tournamentNameInputElement.type = "text"
            tournamentNameInputElement.autocomplete = "off"
            tournamentNameInputElement.placeholder = "tournament name"
            tournamentNameInputElement.classList.add("form-control", "secondary-background-color", "default-text-color")

            let createButtonElement = document.createElement("button")
            createButtonElement.classList.add("btn", "btn-outline-secondary", "primary-text-color", "disabled")
            createButtonElement.innerText = "Create tournament"
            createButtonElement.onclick = () => createTournament(currentUser.id, tournamentNameInputElement.value)
                .then(_ => refreshList())


            let errorContainerDiv = document.createElement("div")

            let tournamentNameAlreadyExistsError = document.createElement('span')
            tournamentNameAlreadyExistsError.classList.add("ongoing-game-error", "fst-italic", "text-danger")
            tournamentNameAlreadyExistsError.innerText = 'There is already a tournament with this name'

            let tournamentNameTooShortError = document.createElement('span')
            tournamentNameTooShortError.classList.add("ongoing-game-error", "fst-italic", "text-danger")
            tournamentNameTooShortError.innerText = 'The tournament name must be at least 3 characters long'


            tournamentNameInputElement.addEventListener("input", (event) => {

                let tournamentNameExists = tournaments.map(t => t.name).includes(event.target?.value)
                let nameTooShort = event.target.value?.length < 2

                if (event.target.value?.length < 2 || tournamentNameExists) {
                    createButtonElement.classList.add("disabled")

                    if (nameTooShort) {
                        errorContainerDiv.appendChild(tournamentNameTooShortError)
                    } else if(errorContainerDiv.contains(tournamentNameTooShortError)) {
                        errorContainerDiv.removeChild(tournamentNameTooShortError)
                    }

                    if (tournamentNameExists) {
                        errorContainerDiv.appendChild(tournamentNameAlreadyExistsError)
                    } else if (errorContainerDiv.contains(tournamentNameAlreadyExistsError)) {
                        errorContainerDiv.removeChild(tournamentNameAlreadyExistsError)
                    }

                } else {
                    createButtonElement.classList.remove("disabled")
                    if (errorContainerDiv.contains(tournamentNameAlreadyExistsError)) errorContainerDiv.removeChild(tournamentNameAlreadyExistsError)
                    if (errorContainerDiv.contains(tournamentNameTooShortError)) errorContainerDiv.removeChild(tournamentNameTooShortError)
                }
            });

            divTournamentNameElement.appendChild(tournamentNameInputElement)
            divTournamentNameElement.appendChild(createButtonElement)
            tournamentListComponent.appendChild(divTournamentNameElement)
            tournamentListComponent.appendChild(errorContainerDiv)
        })


    }

    async function refreshList() {
        const isLoggedIn = await isConnected();
        document.getElementById("tournament-main").innerHTML = await loadPage("/components/tournament/tournament.html");

        if (isLoggedIn) {
            Promise.all([getCurrentUser().then(result => result.json()), getTournaments()])
                .then((results) => handleTournamentList(results[0], results[1]))
        }
    }

    function buildSubTournamentList(dataList, body) {
        for (const data of dataList) {
            let tournamentElement = document.createElement("div")
            tournamentElement.classList.add("w-100", "p-1", "primary-text-color", "d-flex", "justify-content-between")

            let container = document.createElement("div")
            container.classList.add("d-flex", "flex-column")

            let title = document.createElement("span")
            title.classList.add("fw-bold")
            title.innerText = data.tournament.name
            container.appendChild(title)

            let userCountElement = document.createElement("span")
            userCountElement.innerText = data.users.length + ' participant' + (data.users.length <= 1 ? '' : 's')
            container.appendChild(userCountElement)

            tournamentElement.appendChild(container)

            let detailButton = document.createElement("span")
            detailButton.classList.add("pointer", "d-flex", "flex-row", "align-items-center", "default-text-color")
            detailButton.innerHTML = 'more <i class="fa-solid fa-chevron-right ps-1"></i>'
            detailButton.onclick = () => {
                router.navigate('/tournaments/' + data.tournament.id);
            }
            tournamentElement.appendChild(detailButton)

            body.appendChild(tournamentElement)
        }
    }

}