import Character from "../Character.js";

export class Magician extends Character {
    constructor(level) {
        super(level, 'magician');
        this.attack = 30;
        this.defense = 10;
    }
}