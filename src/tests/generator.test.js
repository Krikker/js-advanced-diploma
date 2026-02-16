import { characterGenerator, generateTeam } from "../js/generators";
import {Bowman} from "../js/characters/Bowman";
import {Swordsman} from "../js/characters/Swordsman";
import {Magician} from "../js/characters/Magician";
import {Vampire} from "../js/characters/Vampire";
import { Undead } from "../js/characters/Undead";
import {Daemon} from "../js/characters/Daemon";

test('Проверка генераторов', () => {
    const allowed = [Bowman, Swordsman, Magician, Vampire, Undead, Daemon];
    const allowedTypes = ['bowman', 'swordsman', 'magician', 'vampire', 'undead', 'daemon'];
    const gen = characterGenerator(allowed, 4);
    for (let i = 0; i < 10; i++) {
        expect(gen.next().done).toBe(false);
        expect(gen.next().value).toBeDefined();
        expect(allowedTypes).toContain(gen.next().value.type);
    }

    const genTeam = generateTeam(allowed, 4, 4);
    expect(genTeam.characters.length).toBe(4);
    expect(genTeam.characters.every(c => c.level >= 1 && c.level <= 4)).toBe(true);
})