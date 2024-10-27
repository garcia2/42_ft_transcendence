import loadPage from "../../utils/loadPage.js";
import {isConnected} from "../loginComponents/loginComponents.js";
import {
    addFriend, getCurrentUser,
    getCurrentUserFriends,
    listUsers,
    removeFriend
} from "../../services/user.service.js";

export function setupFriendComponent(router) {
    router.routes['/friends'] = {
        render: () => {
            return `
			<h1 class="title-text-color pt-5">Friends</h1>
			<div class="d-flex flex-column align-items-center w-50 primary-background-color p-3 rounded" id=friends-main>
				<div class="spinner mt-5" role="status">
					<span class="visually-hidden">Loading...</span>
				</div>
			</div>
			`;
        },

        init: async () => {
            await loadComponent()
        }
    };

    document.getElementById('nav-friends').addEventListener('click', (e) => {
        e.preventDefault();
        router.navigate('/friends');
    });

    async function loadComponent() {
        const isLoggedIn = await isConnected();
        let friendsMain = document.getElementById("friends-main")
        friendsMain.innerHTML = await loadPage("/components/friends/friend.html");

        let friendList = document.getElementById("friend-list")
        let addFriendButton = document.getElementById("add-friend-button")
        let addFriendInput = document.getElementById("add-friend-input")

        if (isLoggedIn) {
            Promise.all([
                listUsers(),
                getCurrentUser().then(result => result.json()),
                getCurrentUserFriends()
            ]).then(results => {
                let users = results[0]
                let currentUser = results[1]
                let friends = results[2].friends

                let loggedInUserList = localStorage.getItem("loggedInUserList")

                friends.forEach(friend => {
                    friend.present = loggedInUserList.includes(friend.nickname)

                    let friendElement = document.createElement("div")
                    friendElement.classList.add("d-flex", "justify-content-between")

                    let friendElementTitle = document.createElement("div")
                    friendElementTitle.classList.add("pointer")
                    friendElementTitle.innerHTML = friend.nickname
                        + (friend.present
                            ? '<i class="ps-2 fa-solid fa-circle text-success"></i>'
                            : '<i class="ps-2 fa-solid fa-circle text-danger"></i>')
                    friendElementTitle.onclick = _ => router.navigate("/users/" + friend.id)

                    let friendDelete = document.createElement("div")
                    friendDelete.innerHTML = 'remove friend <i class="ps-1 fa-solid fa-xmark"></i>'
                    friendDelete.classList.add("pointer", "text-danger", "fst-italic")
                    friendDelete.onclick = _ => removeFriend(friend.id)
                        .then(_ => loadComponent())

                    friendElement.appendChild(friendElementTitle)
                    friendElement.appendChild(friendDelete)

                    friendList.appendChild(friendElement)
                })

                addFriendButton.onclick = _ => {
                    document.getElementById("no-user-found-error").classList.add("d-none")
                    document.getElementById("no-self-friend-error").classList.add("d-none")
                    document.getElementById("already-friend-error").classList.add("d-none")

                    let newFriendUserId = users.find(u => u.nickname === addFriendInput.value)?.id

                    if (!newFriendUserId) {
                        document.getElementById("no-user-found-error").classList.remove("d-none")
                    } else if (newFriendUserId === currentUser.id) {
                        document.getElementById("no-self-friend-error").classList.remove("d-none")
                    } else if (friends.map(f => f.id).includes(newFriendUserId)) {
                        document.getElementById("already-friend-error").classList.remove("d-none")
                    } else {
                        addFriend(newFriendUserId).then(_ => loadComponent())
                    }

                    addFriendInput.value = ""
                }

            })
        }
        else {
            friendsMain.innerHTML = `<p>Please log in to view your friends.</p>`;
        }
    }


}