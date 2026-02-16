import Character from "../Character.js";

export class Swordsman extends Character {
    constructor(level) {
        super(level, 'swordsman');
        this.attack = 30;
        this.defense = 20;
    }
}