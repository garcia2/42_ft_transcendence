import loadPage from "../../utils/loadPage.js";
import { updateNavConnected, URLS } from "../../app.js";

export function setupLoginIntraComponent(router) {

	const loginIntraComponent = {
		render: () => `
			<h1 class="title-text-color pt-5">CallBack</h1>
			<div class="d-flex flex-column align-items-center w-100" id=callback-main>
				<div class="spinner mt-5" role="status">
					<span class="visually-hidden">Loading...</span>
				</div>
			</div>
		`,

		init: async () => {

			loginIntra42(router);


		}
	};

	router.routes['/callback'] = loginIntraComponent;
}

async function loginIntra42(router) {

	const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

	if (!code)
		return false;

	try {

		const response = await fetch(URLS.API + '/users/register_or_login_with_ft/', {
	
			method: 'POST',
			body: JSON.stringify({
	
				code: code
			})
		}) 
	
		if (!response.ok) {
			throw new Error(`HTTP error! status ${response.status}`);
		}

		const result = await response.json();
		if (result.user) {

			localStorage.setItem("token", result.token);
			localStorage.setItem("ft_token", result.ft_token);
			updateNavConnected(result.user, router);
			router.navigate('/users/' + result.user.id);
		}
		else {
			setupRegisterForm(result.ft_token, router);
		}
	} catch (error) {

		console.log("Error: ", error);
	}

}


async function setupRegisterForm(ft_token, router) {

	const htmlContent = await loadPage("/components/CallBackComponents/CallBackContent.html");
	document.getElementById("callback-main").innerHTML = htmlContent;

	document.getElementById('ft-register-form').addEventListener('submit', async function(event) {

		event.preventDefault();

		const ftRegisterForm = document.getElementById('ft-register-form');
		const nicknameFeedback = document.getElementById("ft-register-nickname-feedback");
		const nicknameForm = document.getElementById('ft-register-nickname');
		const nickname = nicknameForm.value;

		if ( !checkInputs(nicknameForm, nickname, nicknameFeedback) ) {

			return;
		}

		const formData = new FormData();
		formData.append('nickname', nickname);
		formData.append('ft_token', ft_token);

		try {
			const response = await fetch(URLS.API + "/users/finish_register_with_ft/", {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status ${response.status}`);
			}

			const result = await response.json();
			ftRegisterForm.reset();
			localStorage.setItem("token", result.token);
			localStorage.setItem("ft_token", result.ft_token);
			updateNavConnected(result.user, router);
			router.navigate('/users/' + result.user.id);

		} catch (error) {
			nicknameForm.classList.add("is-invalid");
			nicknameFeedback.innerHTML = "Nickname already used";
			nicknameForm.addEventListener("input", function() {
				this.classList.remove("is-invalid");
			});
			ftRegisterForm.reset();
			console.error('Error:', error);
		}
	});
}

function checkInputs(nicknameForm, nickname, nicknameFeedback){


	document.getElementById("ft-register-nickname").classList.remove("is-invalid");

	if (!nickname) {

		nicknameForm.value = "";
		nicknameFeedback.innerHTML = "Nickname cannot be empty";
		nicknameForm.classList.add("is-invalid");
		nicknameForm.addEventListener("input", function() {
			this.classList.remove("is-invalid");
		});
		return (false);
	}

	return (true);
}