import { URLS } from "../../app.js";
import loadPage from "../../utils/loadPage.js";
import { getTokenUserInfo } from "../../utils/utils.js";
import { isConnected } from "../loginComponents/loginComponents.js";

export function setupTfaComponent(router) {

	const tfaComponent = {
		render: () => {
			return `
				<h1 class="title-text-color pt-5">Two Factor Authentication</h1>
				<div class="d-flex flex-column align-items-center w-100" id=tfa-main>
					<div class="spinner mt-5" role="status">
						<span class="visually-hidden">Loading...</span>
					</div>
				</div>
			`;
		},

		init: async () => {
			const tfaMain = document.getElementById("tfa-main");
			const tfaContent = await loadPage("/components/tfaComponents/tfaContent.html"); 	
			const token = localStorage.getItem('token');

			if (isConnected) {

				tfaMain.innerHTML = tfaContent;
	
				const tfaActivateForm = document.getElementById("tfa-activate-form");
				const tfaConfirmForm = document.getElementById("tfa-confirm-form");
				const tfaConfirmDiv = document.getElementById("tfa-confirm-div");

				setupTfaMailForm(tfaActivateForm, tfaConfirmDiv, token);
				setupResendTfaCode(tfaActivateForm, token);
				setupTfaCodeForm(tfaConfirmForm, token, router);
				setupBackBUtton(tfaActivateForm, tfaConfirmDiv)

				
			} else {
				accountContent.innerHTML = `<p>Please log in to setup Two-Factor Authentication.</p>`;
			}
		}
	};

	router.routes['/tfa'] = tfaComponent;
}

function setupTfaMailForm(tfaActivateForm, tfaConfirmDiv, token) {

	tfaActivateForm.addEventListener("submit", async function(e) {
		document.getElementById("activate-mail-button").classList.add('disabled')
		e.preventDefault();

		const data = {

			tfa_mail: document.getElementById("tfa-mail").value
		}

		try {

			if (checkMailFormat(data.tfa_mail) == false) {

				// document.getElementById("tfa-mail").value = null;
				document.getElementById("tfa-mail-feedback").innerHTML = "Invalid mail format";
				document.getElementById("tfa-mail").classList.add("is-invalid");
				document.getElementById("tfa-mail").addEventListener("input", function() {
					this.classList.remove("is-invalid");
				});
				throw new Error(`${data.tfa_mail} is not a valid mail`);
			}
			const response = await fetch(URLS.API + '/users/send-tfa-mail/', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});

			if (!response.ok) {

				throw new Error(`HTTP error! status: ${response.status}`);
			}
			// toDo check error cases
			tfaActivateForm.classList.add("d-none");
			tfaConfirmDiv.classList.remove("d-none");
			document.getElementById("activate-mail-button").classList.remove('disabled')
		} catch (error) {
		
			console.log("error: ", error);
		}
	});
}

function setupResendTfaCode(tfaActivateForm, token) {

	document.getElementById("resend-tfa-code").addEventListener("click", async function(e) {
		document.getElementById("activate-tfa-button").classList.add('disabled')
		e.preventDefault();

		const data = {

			tfa_mail: document.getElementById("tfa-mail").value
		}

		try {

			const response = await fetch(URLS.API + '/users/send-tfa-mail/', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});

			if (!response.ok) {

				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			document.getElementById("activate-mail-button").classList.remove('disabled')
		} catch (error) {
		
			console.log("error: ", error);
		}
	});
}

function setupTfaCodeForm(tfaConfirmForm, token, router){

	tfaConfirmForm.addEventListener("submit", async function(e) {
		e.preventDefault();
		let data = {
			tfa_code: document.getElementById("tfa-code").value
			// tfa_code: "012345"
		}

		try {
			let response = await fetch(URLS.API + '/users/validate-tfa-code/', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});

			if (!response.ok) {

				document.getElementById("tfa-code").value = null;
				document.getElementById("tfa-code-feedback").innerHTML = "Invalid code";
				document.getElementById("tfa-code").classList.add("is-invalid");
				document.getElementById("tfa-code").addEventListener("input", function() {
					this.classList.remove("is-invalid");
				});
				const errorMessage = await response.json();
				throw new Error(`HTTP error! status: ${response.status}: ${errorMessage.error}`);
			}

			const formData = new FormData();
			formData.append("tfa_mail", document.getElementById("tfa-mail").value)
			
			const user = await getTokenUserInfo();
			response = await fetch(URLS.API + `/users/update/${user.id}/`, {

				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					// 'Content-Type': 'application/json'
				},
				body: formData
				// body: JSON.stringify(data)
			})

			if (!response.ok) {
				
				document.getElementById("tfa-code").value = null;
				const errorMessage = await response.json();
				throw new Error(`HTTP error! status: ${response.status}: ${errorMessage}`);
			}
			
			const result = await response.json();
			router.navigate('/users/' + result.id);


		} catch (error) {

			console.log("error: ", error);
		}
	});
}

function setupBackBUtton(tfaActivateForm, tfaConfirmDiv) {

	document.getElementById("back-tfa-button").addEventListener("click", function(e) {
		e.preventDefault();
		
		document.getElementById("tfa-code").value = null;
		tfaActivateForm.classList.remove("d-none");
		tfaConfirmDiv.classList.add("d-none");
	});
}

function checkMailFormat(email) {
	const regex = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]+")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;
  
	return regex.test(email);
}
  