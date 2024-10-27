
export function findUserByNickName(users) {

	users.forEach(user => {
		console.log(user.nickname);
	});
}

export async function getTokenUserInfo() {

	const token = localStorage.getItem('token');

	try {
        const response = await fetch('https://localhost:1500/api/users/me/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
			const user = await response.json()
            return user;
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
}

export function formatISODateToReadable(isoDate) {

    const date = new Date(isoDate);

    return date.toLocaleString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: 'numeric', 
        second: 'numeric'
    });
}


