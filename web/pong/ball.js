export class Ball {
	constructor(scene, increaseSpeedMode, speed) {
		this.geometry = new THREE.SphereGeometry(0.3, 10, 10);
		this.material = new THREE.MeshBasicMaterial({ color: 0xffff33 });
		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.mesh.position.set(0, 0, 1);
		this.SERVICE_SIDE = 0;
		scene.add(this.mesh);
		
		this.baseSpeed = 0.14;
		// this.baseSpeed = 0.07;
		if (speed === "slow")
			this.baseSpeed *= 0.7;
		else if (speed === "normal")
			this.baseSpeed *= 1;
		else if (speed === "fast")
			this.baseSpeed *= 1.3;

		this.speedX = this.baseSpeed;
		this.speedY = this.baseSpeed;

		this.isPaused = true;

		this.increaseSpeedMode = false;
		if (increaseSpeedMode === "true")
			this.increaseSpeedMode = true;
		this.numberBallReturn = 0;
		this.previousNumberBallReturnGap = 1;
		this.numberBallReturnGap = 1;
	}

	moveBall(fieldWidth, fieldHeight, leftPaddle, rightPaddle, game) {

		if (this.isPaused) return;

		let newX = this.mesh.position.x + this.speedX;
		let newY = this.mesh.position.y + this.speedY;
		
		if (newX <= -fieldWidth / 2 || newX >= fieldWidth / 2) {
			if (newX <= -fieldWidth / 2) {
				game.increaseScoreright();
				this.speedX *= -1;
				this.resetBall('left');
			}
			if (newX >= fieldWidth / 2) {
				game.increaseScoreleft();
				this.speedX *= -1;
				this.resetBall('right');
			}
			game.updateScore(game.getScore());
			return;

		}
	
		// Check for collision with horizontal walls (top and bottom)
		else if (newY <= -fieldHeight / 2 || newY >= fieldHeight / 2) {
			this.speedY *= -1; // Invert y component of speed
		}
		else if ((newX <= leftPaddle.playerMesh.position.x + 0.5 && newY <= leftPaddle.playerMesh.position.y + leftPaddle.height / 2 && newY >= leftPaddle.playerMesh.position.y - leftPaddle.height / 2) ||
         (newX >= rightPaddle.playerMesh.position.x - 0.5 && newY <= rightPaddle.playerMesh.position.y + rightPaddle.height / 2 && newY >= rightPaddle.playerMesh.position.y - rightPaddle.height / 2)) {

			let relativeIntersectY;
			let normalizedRelativeIntersectionY;
			let bounceAngle;
			let maxBounceAngle = Math.PI / 4; // 45 degrés

			if (newX < 0) { // Collision avec le paddle gauche
				relativeIntersectY = newY - leftPaddle.playerMesh.position.y;
				normalizedRelativeIntersectionY = relativeIntersectY / (leftPaddle.height / 2);
				bounceAngle = normalizedRelativeIntersectionY * maxBounceAngle;

				// Utilise la vitesse actuelle (pas baseSpeed) pour le calcul
				let currentSpeed = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);

				this.speedX = Math.cos(bounceAngle) * currentSpeed;
				this.speedY = Math.sin(bounceAngle) * currentSpeed;

				newX = leftPaddle.playerMesh.position.x + 0.6;
			} else { // Collision avec le paddle droit
				relativeIntersectY = newY - rightPaddle.playerMesh.position.y;
				normalizedRelativeIntersectionY = relativeIntersectY / (rightPaddle.height / 2);
				bounceAngle = normalizedRelativeIntersectionY * maxBounceAngle;

				// Utilise la vitesse actuelle pour le calcul
				let currentSpeed = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);

				this.speedX = -Math.cos(bounceAngle) * currentSpeed;
				this.speedY = Math.sin(bounceAngle) * currentSpeed;

				newX = rightPaddle.playerMesh.position.x - 0.6;
			}

			if (this.increaseSpeedMode) {
				this.numberBallReturn++;
				if (this.numberBallReturn == this.numberBallReturnGap) {
					this.increaseSpeed();
				}
			}
		}




		
		this.mesh.position.set(newX, newY, this.mesh.position.z);
	}

	hasReachedPosition(targetY) {

		const threshold = 0.1;
		const absTargetY = Math.abs(targetY);
		const deltaY = Math.abs(this.mesh.position.y - absTargetY);
		return deltaY <= threshold;
	}
	
	resetBall(side) {

		const offsetX = side === 'left' ? 1 : -1;

		const positionX = (side === 'left' ? -7.5 : 7.5) + offsetX;
		this.mesh.position.set(positionX, 0, 1);

		this.lastServeSide = side; 

		this.isPaused = true;

		this.previousNumberBallReturnGap = 1;
		this.numberBallReturnGap = 1;
		this.numberBallReturn = 0;
	}

	launchBall() {

		this.isPaused = false;

		const directionX = this.lastServeSide === 'left' ? 1 : -1; 
        const directionY = (Math.random() - 0.5) * 2;

		this.speedX = this.baseSpeed * directionX;
		this.speedY = this.baseSpeed * directionY;
	}
	
	changeColorTemporarily() {
		const originalColor = this.material.color.getHex();
		const tempColor = 0x00ff00;

		this.mesh.material.color.setHex(tempColor);

		setTimeout(() => {
			this.mesh.material.color.setHex(originalColor);
		}, 3000); 
	
	}

	increaseSpeed() {
		
		const speedRatio = 1.2;

		this.speedX *= speedRatio;
		this.speedY *= speedRatio;
		const temp = this.numberBallReturnGap;
		this.numberBallReturnGap += this.previousNumberBallReturnGap;
		this.previousNumberBallReturnGap = temp;
	}
}