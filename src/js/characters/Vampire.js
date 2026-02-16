import Character from "../Character.js";

export class Vampire extends Character {
    constructor(level) {
        super(level, 'vampire');
        this.attack = 25;
        this.defense = 15;
    }
}