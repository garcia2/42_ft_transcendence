import { URLS } from "../../app.js";
import loadPage from "../../utils/loadPage.js";
import {setupLogin42} from "../loginComponents/loginComponents.js";

export function setupRegisterComponent(router) {

    const registerComponent = {
        render: () => {

            return `
				<h1 class="title-text-color pt-5">Register</h1>
				<div class="d-flex flex-column align-items-center w-100" id=register-main>
					<div class="spinner mt-5" role="status">
						<span class="visually-hidden">Loading...</span>
					</div>
				</div>
			`
        },
        init: async () => {

            const htmlContent = await loadPage("/components/registerComponents/registerContent.html");
            document.getElementById("register-main").innerHTML = htmlContent;
            const passwordField = document.getElementById("register-password");
            const rules = document.getElementById("password-rules");

            setupLogin42();

            passwordField.addEventListener("focus", function () {

                rules.classList.add("show");
            });

            passwordField.addEventListener("blur", function () {
                if (!rules.contains(document.activeElement)) {
                    rules.classList.remove("show");
                }
            });


            const profilePictureInput = document.getElementById("register-profile-picture");
            profilePictureInput.addEventListener("change", function () {
                const file = profilePictureInput.files[0];

                if (file) {
                    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                    if (!allowedTypes.includes(file.type)) {

                        const errorDiv = document.getElementById("profile-picture-feedback").innerHTML = "Invalid file type";
                        profilePictureInput.classList.add("is-invalid");
                        profilePictureInput.value = "";
                    } else {
                        profilePictureInput.classList.remove("is-invalid");
                    }
                }
            });

            document.getElementById('register-form').addEventListener('submit', async function (event) {

                event.preventDefault();

                const nickname = document.getElementById('register-nickname').value;
                const password = document.getElementById('register-password').value;
                const retypePassword = document.getElementById('register-retype-password').value;
                const profilePicture = document.getElementById('register-profile-picture').files[0];

                if (!checkInputs(nickname, password, retypePassword)) {

                    return;
                }

                const formData = new FormData();
                formData.append('nickname', nickname);
                formData.append('password', password);
                if (profilePicture) {
                    formData.append('profile_photo', profilePicture);
                }

                try {
                    const response = await fetch(URLS.API + "/users/register/", {
                        method: 'POST',
                        body: formData,
                    });

					if (!response.ok) {
						const data = await response.json();
						throw new Error(data.error);
					}

                    document.getElementById('register-form').reset();
                    localStorage.setItem("registerNickname", nickname);
                    router.navigate('/login');

                } catch (error) {
					const errorForm = document.getElementById('register-form-feedback');
					errorForm.innerHTML = error;
					errorForm.classList.remove('d-none');
                    document.getElementById('register-form').reset();
                }
            });

        }
    };

    router.routes['/register'] = registerComponent;

    document.getElementById('nav-register').addEventListener('click', (e) => {
        e.preventDefault();
        router.navigate('/register');
        // registerComponent.init();
    });
}

function checkInputs(nickname, password, retypePassword) {

	document.getElementById("register-form-feedback").classList.add("d-none");
    document.getElementById("register-nickname").classList.remove("is-invalid");
    document.getElementById("register-password").classList.remove("is-invalid");
    document.getElementById("register-retype-password").classList.remove("is-invalid");

    let validation = true;

    if (!nickname) {

        validation = false;
        document.getElementById("register-nickname").value = "";
        document.getElementById("register-nickname-feedback").innerHTML = "Nickname cannot be empty";
        document.getElementById("register-nickname").classList.add("is-invalid");
        document.getElementById("register-nickname").addEventListener("input", function () {
            this.classList.remove("is-invalid");
        });
    }
    if (!password) {

        validation = false;
        document.getElementById("register-password-feedback").innerHTML = "Password cannot be empty";
        document.getElementById("register-password").classList.add("is-invalid");
        document.getElementById("register-password").addEventListener("input", function () {
            this.classList.remove("is-invalid");
        });
    }
	else {

        if (!retypePassword) {

            validation = false;
            document.getElementById("register-retype-password-feedback").innerHTML = "Please confirm your password";
            document.getElementById("register-retype-password").classList.add("is-invalid");
            document.getElementById("register-retype-password").addEventListener("input", function () {
                this.classList.remove("is-invalid");
            });
        } 
        else {
            // if (!isPasswordSecure(password)) {

            //     validation = false;
            //     document.getElementById("register-password-feedback").innerHTML = "Password is not strong enough.";
            //     document.getElementById("register-password").classList.add("is-invalid");
            //     document.getElementById("register-password").addEventListener("input", function () {
            //         this.classList.remove("is-invalid");
            //     });
            // } 
            if (password != retypePassword) {

                validation = false;
                document.getElementById("register-retype-password-feedback").innerHTML = "Passwords do not match";
                document.getElementById("register-retype-password").classList.add("is-invalid");
                document.getElementById("register-retype-password").addEventListener("input", function () {
                    this.classList.remove("is-invalid");
                });
            }

        }
    }

    if (!validation) {

        document.getElementById("register-password").value = "";
        document.getElementById("register-retype-password").value = "";
    }

    return (validation);
}

export function isPasswordSecure(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
        return false;
    }
    if (!hasUpperCase) {
        return false;
    }
    if (!hasLowerCase) {
        return false;
    }
    if (!hasNumber) {
        return false;
    }
    if (!hasSpecialChar) {
        return false;
    }

    return true;
}
