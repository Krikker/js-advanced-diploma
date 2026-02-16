import Character from "../Character.js";

export class Bowman extends Character {
    constructor(level) {
        super(level, 'bowman');
        this.attack = 25;
        this.defense = 15;
    }
}