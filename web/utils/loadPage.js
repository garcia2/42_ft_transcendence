import { URLS } from "../app.js";

export default function loadPage(path) {
	return fetch(URLS.WEB + path)
		.then(response => response.text())
		.then((data) => {
			return data;
		})
		.catch(error => {
			console.error('Erreur lors du chargement du HTML:', error);
			return '';
		});
}
