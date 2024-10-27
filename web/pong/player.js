export class Player {

	constructor(scene, side, size, colorSet) {

		this.side = side;
		// this.speed = 0.1;
		this.speed = 0.2
		this.width = 0.5;
		this.depth = 0.2;
		this.maxY = 5;
		this.minY = -5;
		this.scoreCombo = 0;
		this.height = 2.5;
		if (size === "small")
			this.height *= 0.7;
		else if (size === "normal")
			this.height *= 1;
		else if (size === "tall")
			this.height *= 2;

		const colors = [
			{left: 0xff33cc, right: 0x00ffff},
			{left: 0xff6600, right: 0x00ff99},
			{left: 0x9900ff, right: 0x00ffcc},
		]

		this.geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
		this.material = new THREE.MeshBasicMaterial({ color: side === "left" ? colors[colorSet - 1].left  : colors[colorSet - 1].right });
		this.playerMesh = new THREE.Mesh(this.geometry, this.material);
		this.playerMesh.position.set(side === "left" ? -7.5 : 7.5, 0, 1);

		scene.add(this.playerMesh);
	}


	movePlayerWithArrows(moveUp, moveDown) {

		if (moveUp && this.playerMesh.position.y + this.height / 2 < this.maxY) {
			this.playerMesh.position.y += this.speed;
		}

		else if (moveDown && this.playerMesh.position.y - this.height / 2 > this.minY) {
			this.playerMesh.position.y -= this.speed;
		}


		if (this.playerMesh.position.y + this.height / 2 >= this.maxY) {
			this.playerMesh.position.y = this.maxY - this.height / 2;
		}

		if (this.playerMesh.position.y - this.height / 2 <= this.minY) {
			this.playerMesh.position.y = this.minY + this.height / 2;
		}
	}
	
	movePlayer(x, y, z) {
		this.playerMesh.position.set(x, y, z);
	}


	movePlayerai(ball) {
		this.playerMesh.position.set(-7.5, ball.mesh.position.y, 1);
	}
	
	getCamera() {
		return this.camera;
	}
	
	growHeight(increase) {
		
		this.height += increase;

		const newGeometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
		this.playerMesh.geometry.dispose();
		this.playerMesh.geometry = newGeometry;
	}

	reduceHeight(decrease) {

		this.height -= decrease;
	
		const newGeometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
	
		this.playerMesh.geometry.dispose();
		this.playerMesh.geometry = newGeometry;
	}
}