import {setupUsersComponent} from './components/usersComponent.js';
import {setupHomeComponent} from './components/homeComponents.js';
import {setupRegisterComponent} from './components/registerComponents/registerComponents.js';
import {setupLoginComponent} from './components/loginComponents/loginComponents.js';
import {setupAccountComponent} from './components/accountComponents/accountComponents.js';
import {setupPongComponent} from './pong/pongComponent.js';
import {setupTournamentsComponent} from './components/tournament/tournament.js';
import {setupTournamentDetailComponent} from "./components/tournament/tournament-detail.js";
import {setupTfaComponent} from './components/tfaComponents/tfaComponents.js';
import {setupLoginIntraComponent} from './components/CallBackComponents/CallBackComponents.js';
import {setupFriendComponent} from "./components/friends/friend.js";
import {getCurrentUser} from "./services/user.service.js";
import {setLoggedIn, setLoggedOut} from "./services/websocket.service.js";
import {deleteInvite, getUserInvites} from "./services/invite.service.js";
import { setupUpdateNicknameComponent } from './components/accountComponents/updateNicknameComponents.js';
import { setupUpdatePasswordComponent } from './components/accountComponents/updatePasswordsComponents .js';

const socket = new WebSocket('wss://localhost:1500/ws/presence');

socket.onopen = () => {
    console.log("WebSocket connection established");
};

socket.onmessage = e => {
    localStorage.setItem("loggedInUserList", e.data);
};


export const URLS = {
	API: "https://localhost:1500/api",
	WEB: "https://localhost:1500",
	MEDIA: "https://localhost:1500"
}


class Router {
    constructor() {
        this.routes = {};
        this.data = {}
        window.addEventListener('popstate', () => this._loadRoute(window.location.pathname));
    }

    navigate(path) {
        history.pushState({}, '', path);
        this._loadRoute(path);
    }

    _loadRoute(path) {
        let splitPath = path.split("/")
        splitPath.shift()

        let newPath = ''
        let index = 0;
        for (let sp of splitPath) {
            if (!isNaN(parseInt(sp))) {
                this.data[index] = parseInt(sp)
                sp = ':id'
            }
            index++
            newPath += "/" + sp
        }

        const route = this.routes[newPath];
        if (route) {
            document.getElementById('app').innerHTML = route.render();
            if (route.init) {
                route.init();
            }
        } else {
            document.getElementById('app').innerHTML = '<h1>404 - Page Not Found</h1>';
        }
    }

    _loadInitialRoute() {

        const path = window.location.pathname;
        this._loadRoute(path || '/');
    }
}

// Fonction pour mettre à jour la navigation quand l'utilisateur est déconnecté
export function updateNavDisconnected() {
    document.getElementById('nav-login').classList.remove("d-none");
    document.getElementById('nav-register').classList.remove("d-none");
    document.getElementById('nav-account').classList.add("d-none");
    document.getElementById('nav-tournaments').classList.add("d-none");
    document.getElementById('nav-logout').classList.add("d-none");
    document.getElementById('nav-friends').classList.add("d-none");
    document.getElementById('nav-notifications').classList.add("d-none");
}

// Fonction pour mettre à jour la navigation quand l'utilisateur est connecté
export function updateNavConnected(currentUser, router) {
    let notificationContainer = document.getElementById("notification-container")
    notificationContainer.innerHTML = ""
    document.getElementById('nav-login').classList.add("d-none");
    document.getElementById('nav-register').classList.add("d-none");

    let navAccount = document.getElementById('nav-account')
    navAccount.classList.remove("d-none");
    navAccount.innerHTML = currentUser.nickname + '<i class="fa-solid fa-user ms-1"></i>'

    document.getElementById('nav-tournaments').classList.remove("d-none");
    document.getElementById('nav-logout').classList.remove("d-none");
    document.getElementById('nav-friends').classList.remove("d-none");
    document.getElementById('nav-notifications').classList.remove("d-none");

    getCurrentUser()
        .then(result => result.json())
        .then(currentUser => {
            document.getElementById('nav-account').href = "/users/" + currentUser.id
            document.getElementById('nav-account').addEventListener("click", function(event) {
                event.preventDefault();
                router.navigate(`/users/${currentUser.id}`);
            });
            return currentUser
        })
        .then(currentUser => getUserInvites(currentUser.id))
        .then(invites => {
            document.getElementById("notification-badge").innerText = invites.length

            invites.forEach(invite => {
                let inviteElement = document.createElement('div')
                inviteElement.classList.add('alert', 'alert-primary');
                let notificationTextElement = document.createElement('div')
                notificationTextElement.innerText =invite.message
                inviteElement.appendChild(notificationTextElement)
                notificationContainer.appendChild(inviteElement)
            })
        })
}

document.getElementById("nav-logout").addEventListener("click", () => {
    localStorage.removeItem('token');
    localStorage.removeItem('ft_token');
    updateNavDisconnected();
    setLoggedOut()
    router.navigate('/');
});

// Initialisation du routeur
const router = new Router();

// Configuration des composants
setupHomeComponent(router);
setupRegisterComponent(router);
setupLoginComponent(router);
setupAccountComponent(router);
setupPongComponent(router);
setupTournamentsComponent(router);
setupTournamentDetailComponent(router);
setupTfaComponent(router);
setupLoginIntraComponent(router);
setupFriendComponent(router);
setupUpdateNicknameComponent(router);
setupUpdatePasswordComponent(router);

getCurrentUser()
    .then(result => result.json())
    .then(currentUser => {
        if (currentUser.error) {
            updateNavDisconnected();
        } else {
            updateNavConnected(currentUser, router);

            if (socket.readyState === WebSocket.OPEN) {
                setLoggedIn(currentUser.nickname);
            } else {
                socket.onopen = () => {
                    setLoggedIn(currentUser.nickname);
                };
            }
        }
    })
    .catch(error => {
        console.error('Error fetching current user:', error);
    });

// Gestion du rafraîchissement de la page
window.addEventListener('load', () => {
    router._loadInitialRoute();
});
