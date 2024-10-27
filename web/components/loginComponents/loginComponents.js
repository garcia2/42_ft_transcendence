import {updateNavConnected} from "../../app.js";
import loadPage from "../../utils/loadPage.js";
import {login} from "../../services/user.service.js";
import {setLoggedIn} from "../../services/websocket.service.js";
import { URLS } from "../../app.js";

export function setupLoginComponent(router) {

	const loginComponent = {
		render: () => `
			<h1 class="title-text-color pt-5">Login</h1>
			<div class="d-flex flex-column align-items-center w-100" id=login-main>
				<div class="spinner mt-5" role="status">
					<span class="visually-hidden">Loading...</span>
				</div>
			</div>
		`,

		init: async () => {

			const htmlContent = await loadPage("/components/loginComponents/loginContent.html");
			const main = document.getElementById("login-main");
			main.innerHTML = htmlContent;

			const form = document.getElementById('login-form');
			const formDiv = document.getElementById('login-div');
			const tfaForm = document.getElementById("tfa-login-form");
			const tfaDiv = document.getElementById("tfa-login-div");
			const spinner = createLoadingSpinner();

			setupBackBUtton(formDiv, tfaDiv);
			setupResendTfaCode();
			setupSendTfaLoginCode(form, tfaForm, router);
			setupLogin42();

			let registerNickname = localStorage.getItem("registerNickname");
			if (registerNickname) {
				document.getElementById("login-nickname").value = registerNickname;
				document.getElementById("register-success").classList.remove("d-none");
				localStorage.removeItem("registerNickname");
				document.getElementById("login-password").setAttribute('autofocus', true);
			} else {
				document.getElementById("login-nickname").setAttribute('autofocus', true);
			}

			form.addEventListener('submit', async (e) => {
				e.preventDefault();
				formDiv.classList.add("d-none");
				main.appendChild(spinner);

				const data = {
					nickname: document.getElementById('login-nickname').value,
					password: document.getElementById('login-password').value
				}

				try {
					const response = await login(data)
					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}

					const result = await response.json();

					if (result.tfa_required === true) {

						formDiv.classList.add("d-none");
						tfaDiv.classList.remove("d-none");
					} else {
						localStorage.setItem('token', result.token);
						updateNavConnected(result.user, router);
						router.navigate('/users/' + result.user.id);
					}

				} catch (error) {
					document.getElementById("register-success").classList.add("d-none");
					document.getElementById("login-feedback").innerHTML = "Invalid nickname or password";
					document.getElementById("login-nickname").classList.add("is-invalid");
					document.getElementById("login-nickname").addEventListener("input", function () {
						this.classList.remove("is-invalid");
					});
					document.getElementById("login-password").value = "";
					formDiv.classList.remove("d-none");
				}

				main.removeChild(spinner);
			});
		}
	};

	router.routes['/login'] = loginComponent;

	document.getElementById('nav-login').addEventListener('click', (e) => {
		e.preventDefault();
		router.navigate('/login');
	});
}

export async function isConnected() {

	const token = localStorage.getItem('token');

	if (!token) {
		return false;
	}

	try {
		const response = await fetch(URLS.API + '/users/me/', {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'application/json'
			}
		});

		if (response.ok) {
			const result = await response.json();
			if (result.error)
				return false;
			return true;
		} else {

			return false;
		}
	} catch (error) {
		console.error('Erreur lors de la vérification du jeton:', error);
		return false;
	}
}

function setupBackBUtton(tfaActivateForm, tfaConfirmDiv) {

	document.getElementById("back-login-button").addEventListener("click", function (e) {
		e.preventDefault();

		document.getElementById("tfa-login-code").value = null;
		document.getElementById("login-password").value = null;
		tfaActivateForm.classList.remove("d-none");
		tfaConfirmDiv.classList.add("d-none");
	});
}

function setupResendTfaCode() {

	document.getElementById("resend-login-code").addEventListener("click", async function (e) {
		e.preventDefault();

		const data = {
			nickname: document.getElementById('login-nickname').value,
			password: document.getElementById('login-password').value
		}

		try {

			const response = await login(data)

			if (!response.ok) {

				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

		} catch (error) {

			console.log("error: ", error);
		}
	});
}

function setupSendTfaLoginCode(form, tfaForm, router) {

	tfaForm.addEventListener('submit', async function (e) {
		e.preventDefault();

		let data = {
			nickname: document.getElementById('login-nickname').value,
			password: document.getElementById('login-password').value
		}

		try {

			data.tfa_code = document.getElementById("tfa-login-code").value;

			const response = await login(data)

			if (!response.ok) {

				document.getElementById("tfa-login-code").value = null;
				document.getElementById("tfa-login-feedback").innerHTML = "Invalid code";
				document.getElementById("tfa-login-code").classList.add("is-invalid");
				document.getElementById("tfa-login-code").addEventListener("input", function () {
					this.classList.remove("is-invalid");
				});
				const errorMessage = await response.json();
				throw new Error(`HTTP error! status: ${response.status}: ${errorMessage.error}`);
			}

			const result = await response.json();

			localStorage.setItem('token', result.token);
			updateNavConnected(result.user, router);

			router.navigate('/users/' + result.user.id);
		
		} catch (error) {

			console.log("error: ", error);
		}
	});
}

function createLoadingSpinner(){

	const exemple = `
		<div class="spinner mt-5" role="status">
			<span class="visually-hidden">Loading...</span>
		</div>
	`;
	let spinner = document.createElement('div');
	spinner.classList.add("spinner", "mt-5");
	spinner.setAttribute("role", "status");

	let spinnerSpan = document.createElement('span');
	spinnerSpan.classList.add("visually-hidden");
	spinnerSpan.innerHTML = "Loading...";

	spinner.appendChild(spinnerSpan);

	return (spinner);
}

export function setupLogin42() {

	document.getElementById('login42').addEventListener('click', function (e) {
		e.preventDefault();
		const client_id = 'u-s4t2ud-d941bd0dae052d0a428abacfedf5a4fe5891a7d16f5b7cc7189cb94589b5be60';
		const redirect_uri = 'https://localhost:1500/callback';
		const auth_url = `https://api.intra.42.fr/oauth/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&response_type=code&prompt=login`;

		window.location.href = auth_url;
	});
}

