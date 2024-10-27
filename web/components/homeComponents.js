
export function setupHomeComponent(router) {

	const homeComponent = {
		render: () => '<h1 class="title-text-color">Home Page</h1><p>Welcome to the home page!</p>'
	};

	router.routes['/'] = homeComponent;
	document.getElementById('nav-home').addEventListener('click', (e) => {
		e.preventDefault();
		router.navigate('/');
	});
}