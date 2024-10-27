// import * as THREE from 'three';
import { Field } from './field.js';
import { Player} from './player.js';
// import { getMousePosition } from './utils.js';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Ball } from './ball.js';
import { Game } from './gamerule.js';
// import { Power } from './power.js';

export function setupPongGame(rules) {
	/**
	 * rules {
	 * 
	 * 	playerSize, [min, max] min max to define
	 * 	ballSpeed [min, max] min max to define
	 * 	colorSet {1, 2, 3}
	 *	speedIncreaseMode {true, false}
	 *	metadata
	 * }
	 */

	setColors(rules.colorSet);
	const gameContainer = document.getElementById('game-container');
	const renderer = new THREE.WebGLRenderer({ alpha: true });
	renderer.setSize(gameContainer.clientWidth, gameContainer.clientHeight);
	gameContainer.appendChild(renderer.domElement);
	
	const camera = new THREE.PerspectiveCamera(75, gameContainer.clientWidth / gameContainer.clientHeight, 2, 1000);
	camera.position.set(0, -10, 4);
	camera.lookAt(new THREE.Vector3(0, 0, 0));
	
	const scene = new THREE.Scene();
	scene.zbackground = null;

	const field = new Field(15, 10, 1);
	const playerLeft = new Player(scene, "left", rules.playerSize, rules.colorSet);
	const playerRight = new Player(scene, "right", rules.playerSize, rules.colorSet);
	const ball = new Ball(scene, rules.speedIncreaseMode, rules.ballSpeed);
	const game = new Game();
	let scoreLimit = rules.scoreLimit;
	if (scoreLimit <= 0 || scoreLimit > 30)
		scoreLimit = 6;

	document.getElementById("score-limit").innerHTML = ("Fiirst at " + scoreLimit);

	game.setupHUD(rules.playerLeftName, rules.playerRightName);
	field.createField(scene);

	let playerMovement = {
		rightUp: false,
		rightDown: false,
		leftUp: false,
		leftDown: false
	};
	setupControls(gameContainer, playerMovement, ball);
	
	window.addEventListener('resize', onWindowResize);

	function onWindowResize() {
		const aspect = gameContainer.clientWidth / gameContainer.clientHeight;
		camera.aspect = aspect;
		camera.updateProjectionMatrix();

		renderer.setSize(gameContainer.clientWidth, gameContainer.clientHeight);
	}

	let animationFrameId;
	return new Promise((resolve) => {

		function animate() {
		
			animationFrameId = requestAnimationFrame(animate);
			ball.moveBall(15, 10, playerLeft, playerRight, game);
		
			playerLeft.movePlayerWithArrows(playerMovement.leftUp, playerMovement.leftDown);
			playerRight.movePlayerWithArrows(playerMovement.rightUp, playerMovement.rightDown);
		
			renderer.render(scene, camera);
		
			if (game.scoreleft === scoreLimit || game.scoreright === scoreLimit) {
				let winner;
				if (game.scoreleft === scoreLimit)
					winner = rules.playerLeftName;
				else
					winner = rules.playerRightName;
				cancelAnimationFrame(animationFrameId);
				endGame(winner);
			}
		}

		function endGame(winner) {

			const titleElement = document.getElementById('game-title');
			const startTextElement = document.getElementById('start-text');
		
			titleElement.innerHTML = winner + " won !";
			startTextElement.innerHTML = "press space to continue";
		
			startTextElement.classList.remove('d-none');
			titleElement.classList.remove('d-none');
		
			gameContainer.addEventListener('keydown', (event) => {
				
				const key = event.key;
		
				if (event.code === 'Space') {
					resolve({
						rules: rules,
						winner: winner,
						scoreLeft: game.scoreleft,
						scoreRight: game.scoreright
					})
				}
			});
		}

		animate();
	})


}

function setupControls(gameContainer, playerMovement, ball) {

	let gameStarted = false;
	const QWERTY = true;

	gameContainer.addEventListener('keydown', (event) => {
		
		const key = event.key;

		if (key === 'ArrowUp') {
			event.preventDefault();
			playerMovement.rightUp = true;
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			playerMovement.rightDown = true;
		}
		
		if ( (QWERTY && (key === 'w' || key === 'W')) || (!QWERTY && (key === 'z' || key === 'Z')) ) {
			event.preventDefault();
			playerMovement.leftUp = true;
		} else if (key === 's' || key === 'S') {
			event.preventDefault();
			playerMovement.leftDown = true;
		}

		if (ball.isPaused && ball.lastServeSide === 'left') {
			if (key === 'd' || key === 'D') {
				event.preventDefault();
				ball.launchBall();
			}
		}

		if (ball.isPaused && ball.lastServeSide === 'right') {
			if (key === 'ArrowLeft') {
				event.preventDefault();
				ball.launchBall();
			}
		}

		if (!gameStarted && event.code === 'Space') {
			event.preventDefault();
			gameStarted = true;
			startCountdown(ball);
		}
	});

	gameContainer.addEventListener('keyup', (event) => {
		
		const key = event.key;
		
		if (key === 'ArrowUp') {
			event.preventDefault();
			playerMovement.rightUp = false;
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			playerMovement.rightDown = false;
		}
		if ( (QWERTY && (key === 'w' || key === 'W')) || (!QWERTY && (key === 'z' || key === 'Z')) ) {
			event.preventDefault();
			playerMovement.leftUp = false;
		} else if (event.key === 's' || event.key === 'S') {
			event.preventDefault();
			playerMovement.leftDown = false;
		}
	});

	gameContainer.setAttribute('tabindex', '0');

}

function startCountdown(ball) {

	let countdown = 3;
	const titleElement = document.getElementById('game-title');
	const startTextElement = document.getElementById('start-text');
	const countdownTextElement = document.getElementById('countdown-text');
	startTextElement.classList.add('d-none');
	titleElement.classList.add('d-none');

	countdownTextElement.style.display = 'block';
	countdownTextElement.textContent = countdown;

	const countdownInterval = setInterval(() => {
		countdown--;
		if (countdown > 0) {
			countdownTextElement.textContent = countdown;
		} else {
			clearInterval(countdownInterval);
			countdownTextElement.style.display = 'none';
			ball.launchBall();
		}
	}, 1000);
}



function setColors(colorSet) {

	const colorsArray = [
		{1: "#ff00cc", 2: "#333399", 3: "#00ffff"},
		{1: "#ff6600", 2: "#9966cc", 3: "#00ff99"},
		{1: "#9900ff", 2: "#330066", 3: "#00ffcc"},
	]

	const colors = colorsArray[colorSet - 1];

	const gameContainer = document.getElementById("game-container");
	const gameTitle = document.getElementById("game-title");
	const startText = document.getElementById("start-text");

	gameContainer.style.background = `linear-gradient(135deg, ${colors[1]} 0%, ${colors[2]} 50%, ${colors[3]} 100%)`;
	
	gameTitle.style.color = colors[1];
	startText.style.color = colors[3];
	
	gameTitle.style.textShadow = `0 0 5px ${colors[1]}, 0 0 10px ${colors[1]}, 0 0 20px ${colors[1]}, 0 0 40px ${colors[1]}`
	startText.style.textShadow = `0 0 5px ${colors[3]}, 0 0 10px ${colors[3]}, 0 0 20px ${colors[3]}, 0 0 40px ${colors[3]}`

}