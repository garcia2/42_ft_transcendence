

export class Power {
    constructor() {
        this.letter = this.randomlettergen();
        this.updateCombo(this.letter);
        this.powerActivated = false;
    }
    randomlettergen() {
        let letter = Math.floor(Math.random() * 26) + 65;
        return String.fromCharCode(letter);
    }
    updateCombo(newletter) {
        const hud = document.getElementById('combohud');
        hud.textContent = `New Letter: ${newletter}`;
    }
    updateScoreCombo(playerRight) {
        const scoreCombo = document.getElementById('scorecombop2');
        scoreCombo.textContent = `Score Combo: ${playerRight.scoreCombo}`;
    }
    increaseCombo(playerRight) {
        playerRight.scoreCombo++;
    }
    checkKey(event, playerRight) {
        let keyPressed = event.key.toUpperCase()
        if (keyPressed === this.letter) {
            this.increaseCombo(playerRight);
            this.letter = this.randomlettergen();
            this.updateCombo(this.letter);
            this.updateScoreCombo(playerRight);
        
        }
    }
    usepower(playerRight, event, playerLeft, ball) {
        if (event.key === "&" && !this.powerActivated && playerRight.scoreCombo >= 2) {
            this.powerActivated = true;
            playerRight.scoreCombo -= 2;
            this.updateScoreCombo(playerRight);
            playerRight.growHeight(1);
        }
        //sticky paddle
        if (event.key === "é" && !this.powerActivated && playerRight.scoreCombo >= 1)
        {
            this.powerActivated = true;
            playerRight.scoreCombo -= 1;
            this.updateScoreCombo(playerRight);
            playerLeft.reduceHeight(playerLeft.height / 2);
        }
        // invisible ball for 1 seconds
        if (event.key === "\"" && !this.powerActivated && playerRight.scoreCombo >= 5)
        {
            this.powerActivated = true;
            playerRight.scoreCombo -= 5;
            this.updateScoreCombo(playerRight);
            ball.changeColorTemporarily();
        }
    }
    resetPowerActivation(event) {
        if (event.key === " ") {
            this.powerActivated = false;
        }
        if (event.key === "1") {
            this.powerActivated = false;
        }
        if (event.key === "2")
            {
                this.powerActivated = false;
            }
        
    }
}
