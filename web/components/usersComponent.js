import { isConnected } from "./loginComponents/loginComponents.js";
import { findUserByNickName } from "../utils/utils.js";
import { URLS } from "../app.js";

export function setupUsersComponent(router) {
	
	const usersComponent = {
		render: () => {
			return `
				<h1 class="title-text-color">Users List Page</h1>
				<div id="users_list-content">
					<p>Loading...</p>
				</div>
			`;
		},

		init : async () => {

			const token = localStorage.getItem('token');

			const isLoggedIn = await isConnected();
			const usersListContent = document.getElementById('users_list-content');

			if (isLoggedIn) {
				const response = await fetch(URLS.API + '/users/users/', {
					method: 'GET',
					headers: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					}
				});
		
				if (response.ok) {
					const data = await response.json();
		
					usersListContent.innerHTML = `
						<h1>Users List</h1>
						<ul id="users-list" class="users-list"></ul>
					`;
					const usersListElement = document.getElementById('users-list');
					data.forEach(user => {
						const userItem = document.createElement('li');
						userItem.innerHTML = `
							<div class="user-card">
								<div class="user-nickname">${user.nickname} [id=${user.id}]</div>
								<div class="user-stats">
									<div>ELO: ${user.elo}</div>
									<div>Wins: ${user.wins}</div>
									<div>Losses: ${user.losses}</div>
								</div>
								<div class="user-status">Status: ${user.status}</div>
							</div>
						`;
						usersListElement.appendChild(userItem);
					});
				} else {
					usersListContent.innerHTML = `<p>Failed to load users listt.</p>`;
				}
			} else {
				usersListContent.innerHTML = `<p>Please log in to view your User's list.</p>`;
			}
		}
	}
	router.routes['/users'] = usersComponent;
	document.getElementById('nav-users').addEventListener('click', (e) => {
		e.preventDefault();
		router.navigate('/users');
	});
}