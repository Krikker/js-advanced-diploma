import Character from "../js/Character";
import { Undead } from "../js/characters/Undead";

test('Проверка на выброс исключения', () => {
    expect(() => new Character(3)).toThrow();

    const newChar = new Undead(1);
    expect(newChar).toEqual({"attack": 40, "health": 50, "defense": 10, "level": 1, "type": "undead"});
})