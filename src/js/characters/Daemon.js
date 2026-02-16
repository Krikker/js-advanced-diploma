import Character from "../Character.js";

export class Daemon extends Character {
    constructor(level) {
        super(level, 'daemon');
        this.attack = 30;
        this.defense = 10;
    }
}