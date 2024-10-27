export class Field {
    constructor(width, height, depth) {
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.field = null;
        this.borders = [];
        this.net = null;
    }

    createField(scene) {
        const fieldGeometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
        const fieldMaterial = new THREE.MeshBasicMaterial({ color: 0x1a1a3e });  // Couleur du sol
        this.field = new THREE.Mesh(fieldGeometry, fieldMaterial);
        scene.add(this.field);

        this.createBorders(scene);

        this.createMiddleLine(scene);
    }

    createBorders(scene) {
        const borderThickness = 0.1;
        const borderHeight = this.height;

        const borderMaterial = new THREE.MeshBasicMaterial({ color: 0x2d2d5c });

        const topBorderGeometry = new THREE.BoxGeometry(this.width, borderThickness, this.depth);
        const topBorder = new THREE.Mesh(topBorderGeometry, borderMaterial);
        topBorder.position.set(0, this.height / 2 + borderThickness / 2, 0);
        scene.add(topBorder);
        this.borders.push(topBorder);

        const bottomBorderGeometry = new THREE.BoxGeometry(this.width, borderThickness, this.depth);
        const bottomBorder = new THREE.Mesh(bottomBorderGeometry, borderMaterial);
        bottomBorder.position.set(0, -(this.height / 2 + borderThickness / 2), 0);
        scene.add(bottomBorder);
        this.borders.push(bottomBorder);

        const leftBorderGeometry = new THREE.BoxGeometry(borderThickness, borderHeight, this.depth);
        const leftBorder = new THREE.Mesh(leftBorderGeometry, borderMaterial);
        leftBorder.position.set(-(this.width / 2 + borderThickness / 2), 0, 0);
        scene.add(leftBorder);
        this.borders.push(leftBorder);

        // Bordure droite (à droite du terrain)
        const rightBorderGeometry = new THREE.BoxGeometry(borderThickness, borderHeight, this.depth);
        const rightBorder = new THREE.Mesh(rightBorderGeometry, borderMaterial);
        rightBorder.position.set(this.width / 2 + borderThickness / 2, 0, 0);
        scene.add(rightBorder);
        this.borders.push(rightBorder);
    }

    createMiddleLine(scene) {
        const lineThickness = 0.05;
        const lineHeight = this.height;

        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

        const lineGeometry = new THREE.BoxGeometry(lineThickness, lineHeight, this.depth);
        const middleLine = new THREE.Mesh(lineGeometry, lineMaterial);
        middleLine.position.set(0, 0, 0);
        scene.add(middleLine);
    }

    createNet(scene) {
        const netGeometry = new THREE.BoxGeometry(0.5, 2, 2);
        const netMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.net = new THREE.Mesh(netGeometry, netMaterial);
        scene.add(this.net);
    }
}

