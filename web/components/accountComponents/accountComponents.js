import {isConnected} from "../loginComponents/loginComponents.js";
import loadPage from "../../utils/loadPage.js";
import {getCurrentUser, getUser, getUserGames, listUsers} from "../../services/user.service.js";
import {getTournamentGames, getTournaments, getTournamentUsers} from "../../services/tournament.service.js";
import {isPasswordSecure} from "../registerComponents/registerComponents.js"
import { URLS } from "../../app.js";

export function setupAccountComponent(router) {

	router.routes['/users/:id'] = {
		render: () => {
			return `
				<h1 class="title-text-color pt-5">Account</h1>
				<div class="d-flex flex-column align-items-center w-100" id=account-main>
					<div class="spinner mt-5" role="status">
						<span class="visually-hidden">Loading...</span>
					</div>
				</div>
			`;
		},

		init: async () => {
			let userId = router.data["1"]

			const token = localStorage.getItem('token');
			const isLoggedIn = await isConnected();
			const accountContent = document.getElementById('account-main');
			const htmlContent = await loadPage("/components/accountComponents/accountContent.html");

			if (isLoggedIn) {
				let tournaments = await getTournaments()
				for (let t of tournaments) {
					t.users = await getTournamentUsers(t.id);
					t.games = await getTournamentGames(t.id);
				}


				let tournamentGameUsers = tournaments.map(t => t.users).flat()
				let tournamentGamesIds = tournaments.map(t => t.games).flat().map(g => g.game_id)

				Promise.all([getUser(userId), getCurrentUser(), listUsers()])
					.then(response => {
						let users = response[2]
						if (response[0].ok && response[1].ok) {
							Promise.all([response[0].json(), response[1].json()])
								.then(response => {
									let user = response[0]
									let currentUser = response[1]

                                    accountContent.innerHTML = htmlContent;

									setupDeleteTfaMail(router, user, token);
									setupUpdateInfo(router);

                                    if (!user.profile_photo && user.tf_id) {

										fetch("https://api.intra.42.fr/v2/me", {

											method: "GET",
											headers: {

												"Authorization": "Bearer " + localStorage.getItem("ft_token")
											}
										}).then(response => response.json())
											.then(result => {
												const profilePicturePath = result.image.link;
												document.getElementById("account-profile-picture").setAttribute("src", profilePicturePath);
												changeProfilePicture(user, token);
											});
									} else {

										const profilePicturePath = (user.profile_photo) ? (URLS.MEDIA + user.profile_photo) : "/assets/default-profile-picture.png"
										document.getElementById("account-profile-picture").setAttribute("src", profilePicturePath);
										changeProfilePicture(user, token);
									}

									document.getElementById("account-nickname").innerHTML = user.nickname;

									let gameHistory = document.getElementById("game-history")
									let gameIndex = 1

									getUserGames(userId).then(games => games.map(game => {
										game.user1 = users.find(u => u.id === game.user1_id)
										game.user2 = users.find(u => u.id === game.user2_id)
										return game
									})).then(games => {
										updateWinsLossesBar(user, games);
										games.forEach(game => {

											let user1 = game.user1
											let user2 = game.user2

											let user1Name = tournamentGamesIds.includes(game.id)
												? tournamentGameUsers?.find(a => user1.id === a.user_id)?.alias ?? user1.nickname
												: user1.nickname;

											let user2Name = tournamentGamesIds.includes(game.id)
												? tournamentGameUsers?.find(a => user2.id === a.user_id)?.alias ?? user2.nickname
												: user2.nickname;


											let gameElement = document.createElement("div")
											gameElement.classList.add('alert', 'alert-primary');

											let player1IsProfileUser = game.user1.id === userId
											let player1Won = player1IsProfileUser ? game.score1 > game.score2 : game.score2 > game.score1
											let player2Won = player1IsProfileUser ? game.score2 > game.score1 : game.score1 > game.score2


											gameElement.innerHTML =
												gameIndex
												+ '<span class="ps-1">- against ' + (player1IsProfileUser ? user2Name : user1Name) + ' -</span>'
												+ (player1Won || player2Won
														?
														'<span class="ps-1 text-success">' + new Date(game.completion_date).toDateString() + ' -</span>'
														+ (
															(player1Won
																	? '<span class="ps-1 text-success">Victory (' + game.score1 + ' / ' + game.score2 + ')</span>'
																	: '<span class="ps-1 text-danger">Defeat (' + game.score2 + ' / ' + game.score1 + ')</span>'
															)
														)
														: '<span class="ps-1 text-info">Ongoing</span>'
												)
											if (player1Won || player2Won)
												gameHistory.appendChild(gameElement)
											gameIndex++
										})
									})


									if (user.id === currentUser.id) {
										document.getElementById("tfa-account-activate").addEventListener("click", (e) => {
											e.preventDefault();
											router.navigate('/tfa');
										})

										if (user.tfa_mail != null) {
											document.getElementById("tfa-account-mail").innerHTML = user.tfa_mail;
											document.getElementById("tfa-account-activate").innerHTML = "(update)";
											document.getElementById("tfa-account-delete").classList.remove("d-none");
										}
									} else {
										document.getElementById("tfa-auth").classList.add("d-none")
									}
								})


						} else {
							accountContent.innerHTML = `<p>Failed to load user information.</p>`;
						}
					})

			} else {
				accountContent.innerHTML = `<p>Please log in to view your account.</p>`;
			}
		}
	};
}


function updateWinsLossesBar(user, games) {
	user.wins = games.filter(game => game.user1_id === user.id ? game.score1 > game.score2 : game.score2 > game.score1).length
	user.losses = games.filter(game => game.user1_id === user.id ? game.score2 > game.score1 : game.score1 > game.score2).length

	let nbW = user.wins;
	let nbL = user.losses;
	if (nbW === 0 && nbL === 0) {
		nbW++;
		nbL++;
	}

	const winsProgressBar = document.getElementById("account-wins-progress-bar");
	winsProgressBar.setAttribute("aria-valuenow", nbW);
	winsProgressBar.setAttribute("aria-valuemin", "0");
	winsProgressBar.style = "width: " + ((nbW + nbL) / nbW * 100) + "%";
	document.getElementById("account-wins-count").innerHTML = user.wins;

	const lossesProgressBar = document.getElementById("account-losses-progress-bar");
	lossesProgressBar.setAttribute("aria-valuenow", (nbW + nbL));
	lossesProgressBar.setAttribute("aria-valuemin", nbW);
	lossesProgressBar.style = "width: " + ((nbW + nbL) / nbL * 100) + "%";
	document.getElementById("account-losses-count").innerHTML = user.losses;
}

function setupDeleteTfaMail(router, user, token) {

	if (localStorage.getItem("ft_token") != null)
	{
		document.getElementById("tfa-auth").classList.add("d-none");
	}
	document.getElementById("tfa-account-delete").addEventListener("click", async function (e) {

		const formData = new FormData();
		formData.append("tfa_mail", "")

		let response = await fetch(URLS.API + `/users/update/${user.id}/`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${token}`
			},
			body: formData
		})

		if (!response.ok) {

			const errorMessage = await response.json();
			throw new Error(`HTTP error! status: ${response.status}: ${errorMessage.error}`);
		}

		router.navigate('/users/' + user.id);
	});
}

function changeProfilePicture(user, token) {

	const profilePicContainer = document.querySelector('.position-relative');
	const profilePic = document.getElementById('account-profile-picture');
	const profilePicFeedBack = document.getElementById('profile-picture-feedback');
	const fileInput = document.getElementById('account-file-input');
	const overlay = profilePicContainer.querySelector('.position-absolute');

	profilePicContainer.addEventListener('mouseover', function () {
		overlay.style.opacity = 1;
	});

	profilePicContainer.addEventListener('mouseout', function () {
		overlay.style.opacity = 0;
	});

	profilePicContainer.addEventListener('click', function () {
		fileInput.click();
	});

	fileInput.addEventListener('change', async function (event) {

		const file = event.target.files[0];

		if (file) {
			const formData = new FormData();
			formData.append("profile_photo", file);

			try {
				const response = await fetch(URLS.API + `/users/update/${user.id}/`, {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${token}`
					},
					body: formData
				});

				if (response.ok) {
					const result = await response.json();

					profilePic.src = URL.createObjectURL(file);
					profilePic.classList.add("border-success");
					profilePicFeedBack.classList.remove("invisible");
					profilePicFeedBack.classList.add("text-success");
				} else {
					profilePic.classList.add("border-danger");
					profilePicFeedBack.classList.remove("invisible");
					profilePicFeedBack.classList.add("text-danger");
					profilePicFeedBack.innerHTML = "Error during profil picture update"
				}
			} catch (error) {
				console.error('Erreur:', error);
				profilePic.classList.add("border-danger");
				profilePicFeedBack.classList.remove("invisible");
				profilePicFeedBack.classList.add("text-danger");
				profilePicFeedBack.innerHTML = "Error during profil picture update"
			}
		}
	});

}

function setupUpdateInfo(router) {

	const updateInfoNicknameDiv = document.getElementById("update-info-nickname");
	const updateInfoPasswordDiv = document.getElementById("update-info-password");

	updateInfoNicknameDiv.addEventListener("click", function (event) {
		
		event.preventDefault();
		router.navigate('/updateNickname');
	});

	updateInfoPasswordDiv.addEventListener("click", function (event) {
		
		event.preventDefault();
		router.navigate('/updatePassword');
	});
}