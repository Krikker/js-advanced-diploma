import GameController from "../js/GameController";
import {Bowman} from "../js/characters/Bowman";
import GamePlay from "../js/GamePlay";

test('Проверка на корректность отображения информации о персонаже', () => {
    const control = new GameController(null, null);
    const char = new Bowman(2);
    expect(control.charInfo`${char.level}${char.attack}${char.defense}${char.health}`).toBe(`🎖2 ⚔25 🛡25 ❤50`);
})

test.each(
    [['bowman', 2, 2, 0, 16, 16], ['swordsman', 4, 1, 0, 32, 8], ['magician', 1, 4, 0, 8, 32], 
     ['vampire', 2, 2, 0, 16, 16], ['undead', 4, 1, 0, 32, 8], ['daemon', 1, 4, 0, 8, 32]]
)('Проверка на допустимый радиус хода и атаки', (type, moveRange, attackRange, startIndex, endMove, endAttack) => {
    const controller = new GameController(null, null);
    const movePossible = controller.orientation(startIndex, endMove, 'move');
    const attackPossible = controller.orientation(startIndex, endAttack, 'attack');
    const moves = controller.possibleMoves(type);
    const attack = controller.possibleAttack(type);
    expect(moves).toBe(moveRange);
    expect(attack).toBe(attackRange);
    expect(movePossible <= moves).toBe(true);
    expect(attackPossible <= attack).toBe(true);
})

jest.mock('../js/GamePlay', () => {
    return jest.fn().mockImplementation(() => ({
    redrawPositions: jest.fn(),
    selectCell: jest.fn(),
    deselectCell: jest.fn(),
    drawUi: jest.fn(),
    }));
});
GamePlay.showError = jest.fn();

describe('GameController load', () => {
    let gamePlay;
    let stateService;
    let controller;

    beforeEach(() => {
        GamePlay.showError.mockClear();
        gamePlay = new GamePlay();
        stateService = {
        load: jest.fn(),
        save: jest.fn()
        };
        controller = new GameController(gamePlay, stateService);
    });

    test('Успешная загрузка игры', () => {
        const mockState = {
        level: 2,
        currentPlayer: 'player',
        selectedCharacterPosition: 5,
        isGameOver: false,
        selectedCharacter: {
            type: 'bowman',
            level: 2,
            health: 80,
            attack: 30,
            defence: 30,
            position: 5
        },
        characters: [
            {
            type: 'bowman',
            level: 2,
            health: 80,
            attack: 30,
            defence: 30,
            position: 5
            }
        ]
        };

        stateService.load.mockReturnValue(mockState);
        controller.onLoadGameClick();
        
        expect(controller.gameState.level).toBe(2);
        expect(controller.gameState.selectedCharacterPosition).toBe(5);
        expect(controller.positionedCharacters.length).toBe(1);
        expect(controller.positionedCharacters[0].character.type).toBe('bowman');
        expect(GamePlay.showError).not.toHaveBeenCalled();
    });

    test('Загрузка закончилась ошибкой', () => {
        stateService.load.mockImplementation(() => {
            throw new Error('Invalid state');
        });
        controller.onLoadGameClick();

        expect(GamePlay.showError).toHaveBeenCalledWith('Не удалось загрузить игру!');
        expect(controller.gameState.level).toBe(1);
        expect(controller.positionedCharacters.length).toBe(0);
    })
})