import { URLS } from "../../app.js";
import loadPage from "../../utils/loadPage.js";
import { isPasswordSecure } from "../registerComponents/registerComponents.js";
import { getTokenUserInfo } from "../../utils/utils.js";
import { isConnected } from "../loginComponents/loginComponents.js";

export function setupUpdatePasswordComponent(router) {

	const updatePasswordComponent = {
		render: () => {

			return `
				<h1 class="title-text-color pt-5">Update User Passsword</h1>
				<div class="d-flex flex-column align-items-center w-100" id=update-main>
					<div class="spinner mt-5" role="status">
						<span class="visually-hidden">Loading...</span>
					</div>
				</div>
			`
		},
		init: async () => {

			const updateContent = document.getElementById("update-main")
			const connected = await isConnected();
			if (connected) {

				if (localStorage.getItem("ft_token") != null) {
					updateContent.innerHTML = `<p> No password to update with account linked to intra42.</p>`;
					return;
				}

				const htmlContent = await loadPage("/components/accountComponents/updatePasswordContent.html");
				updateContent.innerHTML = htmlContent;
				const passwordField = document.getElementById("update-password");
				const rules = document.getElementById("password-rules");
				const user = await getTokenUserInfo();

				passwordField.addEventListener("focus", function () {

					rules.classList.add("show");
				});

				passwordField.addEventListener("blur", function () {
					if (!rules.contains(document.activeElement)) {
						rules.classList.remove("show");
					}
				});

				document.getElementById('update-form').addEventListener('submit', async function (event) {

					event.preventDefault();

					const password = document.getElementById('update-password').value;
					const retypePassword = document.getElementById('update-retype-password').value;

					if (!checkInputs(password, retypePassword)) {

						return;
					}

					const formData = new FormData();
					
					if (password) {

						formData.append('password', password);
					}
					
					try {
						
						const user = await getTokenUserInfo();

						if (!user)
							throw new Error("Error with user connection (JWS)");

						const token = localStorage.getItem("token");
						const response = await fetch(URLS.API + `/users/update/${user.id}/`, {
							method: 'POST',
							headers: {
								'Authorization': `Bearer ${token}`
							},
							body: formData,
						});


						if (!response.ok) {
							const data = await response.json();

							throw new Error(data.error);
						}

						document.getElementById('update-form').reset();
						router.navigate(`/users/${user.id}`);

					} catch (error) {
						const errorForm = document.getElementById('update-form-feedback');
						errorForm.innerHTML = error;
						errorForm.classList.remove('d-none');
						document.getElementById('update-form').reset();
					}
				});
			} else {
				updateContent.innerHTML = `<p>Please log in to update your info.</p>`;
			}
		}
	};

	router.routes['/updatePassword'] = updatePasswordComponent;

}

function checkInputs(password, retypePassword) {

	document.getElementById("update-password").classList.remove("is-invalid");
	document.getElementById("update-retype-password").classList.remove("is-invalid");
	document.getElementById("update-form-feedback").classList.add("d-none");

	let validation = true;

	if (!password) {

		document.getElementById("update-form-feedback").innerHTML = "No info given to update";
		document.getElementById("update-form-feedback").classList.remove("d-none");
		return false;
	}


	if (password) {

		if (!retypePassword) {

			validation = false;
			document.getElementById("update-retype-password-feedback").innerHTML = "Please confirm your password";
			document.getElementById("update-retype-password").classList.add("is-invalid");
			document.getElementById("update-retype-password").addEventListener("input", function () {
				this.classList.remove("is-invalid");
			});
		} else {
			if (password != retypePassword) {

				validation = false;
				document.getElementById("update-retype-password-feedback").innerHTML = "Passwords do not match";
				document.getElementById("update-retype-password").classList.add("is-invalid");
				document.getElementById("update-retype-password").addEventListener("input", function () {
					this.classList.remove("is-invalid");
				});
			}

		}
	}

	if (!validation) {

		document.getElementById("update-password").value = "";
		document.getElementById("update-retype-password").value = "";
	}

	return (validation);
}
