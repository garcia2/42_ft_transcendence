import { URLS } from "../../app.js";
import loadPage from "../../utils/loadPage.js";
import { isPasswordSecure } from "../registerComponents/registerComponents.js";
import { getTokenUserInfo } from "../../utils/utils.js";
import { isConnected } from "../loginComponents/loginComponents.js";

export function setupUpdateNicknameComponent(router) {

	const updateNicknameComponent = {
		render: () => {

			return `
				<h1 class="title-text-color pt-5">Update Nickname</h1>
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

				const htmlContent = await loadPage("/components/accountComponents/updateNicknameContent.html");
				updateContent.innerHTML = htmlContent;

				document.getElementById('update-form').addEventListener('submit', async function (event) {

					event.preventDefault();

					const nickname = document.getElementById('update-nickname').value;

					if (!checkInputs(nickname)) {

						return;
					}

					const formData = new FormData();
					if (nickname) {

						formData.append('nickname', nickname);
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
						if (nickname)
							document.getElementById('nav-account').innerHTML = user.nickname + '<i class="fa-solid fa-user ms-1"></i>'
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

	router.routes['/updateNickname'] = updateNicknameComponent;

}

function checkInputs(nickname) {


	document.getElementById("update-nickname").classList.remove("is-invalid");
	document.getElementById("update-form-feedback").classList.add("d-none");

	let validation = true;

	if (!nickname) {

		document.getElementById("update-form-feedback").innerHTML = "No info given to update";
		document.getElementById("update-form-feedback").classList.remove("d-none");
		return false;
	}

	return (validation);
}
