import Character from "../Character.js";

export class Undead extends Character {
    constructor(level) {
        super(level, 'undead');
        this.attack = 30;
        this.defense = 20;
    }
}