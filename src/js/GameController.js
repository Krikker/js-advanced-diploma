import GamePlay from "./GamePlay";
import GameState from "./GameState";
import themes from "./themes";
import { generateTeam } from "./generators";
import PositionedCharacter from "./PositionedCharacter.js";
import {Bowman} from './characters/Bowman.js';
import {Swordsman} from './characters/Swordsman.js';
import {Magician} from './characters/Magician.js';
import {Vampire} from './characters/Vampire.js';
import {Undead} from './characters/Undead.js';
import {Daemon} from './characters/Daemon.js';
import cursors from "./cursors";

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.positionedCharacters = [];
    this.gameState = new GameState();
    this.goodArrHeroes = ['bowman', 'swordsman', 'magician'];
    this.evilArrHeroes = ['vampire', 'undead', 'daemon'];
    this.listenersAdded = false;
  }

  init() {
    this.gamePlay.drawUi(themes(this.gameState.level));
    this.gameState.currentPlayer = 'player';

    const goodTypes = [Bowman, Swordsman, Magician];
    const evilTypes = [Vampire, Undead, Daemon];
    const newGoodAmount = this.positionedCharacters.length > 0
      ? (this.gameState.level + 1) - this.positionedCharacters.length
      : this.gameState.level + 1;

    const goodTeam = generateTeam(goodTypes, this.gameState.level, newGoodAmount);
    if (this.positionedCharacters.length !== 0) {
      for (const char of this.positionedCharacters) {
        goodTeam.characters.push(char.character);
      }
    } 
    const evilTeam = generateTeam(evilTypes, this.gameState.level, this.gameState.level + 1);

    const goodPos = [];
    const evilPos = [];

    for (let row = 0; row < 8; row++) {
      goodPos.push(row*8, row * 8 + 1);
      evilPos.push(row*8 + 6, row * 8 + 7);
    }

    const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
    const goodChosenPos = shuffle(goodPos).slice(0, this.gameState.level + 1);
    const evilChosenPos = shuffle(evilPos).slice(0, this.gameState.level + 1);
    const goodTeamWithPos = goodTeam.characters.map((char, i) => 
      new PositionedCharacter(char, goodChosenPos[i])
    );
    const evilTeamWithPos = evilTeam.characters.map((char, i) => 
      new PositionedCharacter(char, evilChosenPos[i])
    );
    this.positionedCharacters = [...goodTeamWithPos, ...evilTeamWithPos];
    this.gamePlay.redrawPositions(this.positionedCharacters);
    this.updateGameStateCharacters();

    if (!this.listenersAdded) {
      this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
      this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
      this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
      this.gamePlay.addNewGameListener(this.onNewGameClick.bind(this));
      this.gamePlay.addSaveGameListener(this.onSaveGameClick.bind(this));
      this.gamePlay.addLoadGameListener(this.onLoadGameClick.bind(this));
      this.listenersAdded = true;
    }
  }

  charInfo(strings, level, attack, defense, health) {
    return `🎖${level} ⚔${attack} 🛡${defense} ❤${health}`;
  }

  onSaveGameClick() {
    this.stateService.save(this.gameState);
  }

  onLoadGameClick() {
    if (this.gameState.selectedCharacterPosition !== null) {
      this.gamePlay.deselectCell(this.gameState.selectedCharacterPosition);
    };
    try {
      this.gameState = this.stateService.load();
      this.positionedCharacters = this.gameState.characters.map(char => {
        let CharacterClass;
        switch (char.type) {
          case 'bowman': CharacterClass = Bowman; break;
          case 'swordsman': CharacterClass = Swordsman; break;
          case 'magician': CharacterClass = Magician; break;
          case 'vampire': CharacterClass = Vampire; break;
          case 'undead': CharacterClass = Undead; break;
          case 'daemon': CharacterClass = Daemon; break;
        }
        const character = new CharacterClass(char.level);
        character.health = char.health;
        character.attack = char.attack;
        character.defense = char.defense;
        
        return new PositionedCharacter(character, char.position);
      });

      this.gamePlay.drawUi(themes(this.gameState.level));
      this.gamePlay.redrawPositions(this.positionedCharacters);

      if (this.gameState.selectedCharacterPosition !== null) {
        this.gamePlay.selectCell(this.gameState.selectedCharacterPosition);
        const selected = this.positionedCharacters.find(
          p => p.position === this.gameState.selectedCharacterPosition
        );
        if (selected) {
          this.gameState.selectedCharacter = selected.character;
        };
      }
    } catch {
      GamePlay.showError('Не удалось загрузить игру!');
    }
  }

  onNewGameClick() {
    this.gameState.level = 1;
    this.gameState.isGameOver = false;
    this.positionedCharacters = [];
    this.init();
  }

  async onCellClick(index) {
    if (this.gameState.isGameOver || this.gameState.currentPlayer !== 'player') {
      return;
    }
    const position = this.positionedCharacters.find(
      char => char.position === index && this.goodArrHeroes.includes(char.character.type)
    );

    if (position) {
      if (this.gameState.selectedCharacterPosition !== null) {
        this.gamePlay.deselectCell(this.gameState.selectedCharacterPosition);
        this.gameState.selectedCharacter = null;
        this.gameState.selectedCharacterPosition = null;
      }
      this.gamePlay.selectCell(index);
      this.gameState.selectedCharacter = position.character;
      this.gameState.selectedCharacterPosition = position.position;
      return;
    }
    
    if (!this.gameState.selectedCharacter) {
      GamePlay.showError('Нельзя выбирать пустую клетку или вражеского героя!');
      return;
    }

    const distance = this.orientation(this.gameState.selectedCharacterPosition, index, 'move');
    const distanceAttack = this.orientation(this.gameState.selectedCharacterPosition, index, 'attack');
    const moveRange = this.possibleMoves(this.gameState.selectedCharacter.type);
    const attackRange = this.possibleAttack(this.gameState.selectedCharacter.type);
    const evilPosition = this.positionedCharacters.find(
      char => char.position === index && this.evilArrHeroes.includes(char.character.type)
    );

    if (this.gameState.selectedCharacter !== null && distance <= moveRange && !evilPosition) {
      this.gamePlay.deselectCell(this.gameState.selectedCharacterPosition);
      this.gamePlay.selectCell(index);
      const needToMove = this.positionedCharacters.find(
        char => char.character === this.gameState.selectedCharacter && char.position === this.gameState.selectedCharacterPosition
      );
      needToMove.position = index;
      this.gameState.selectedCharacterPosition = index;
      this.gamePlay.redrawPositions(this.positionedCharacters);
      this.updateGameStateCharacters();
      this.gameState.currentPlayer = 'comp';
      await this.makeCompTurn();
      return;
    }

    if (this.gameState.selectedCharacter !== null && evilPosition && distanceAttack <= attackRange) {
      const attackerPositioned = this.positionedCharacters.find(
        char => char.position === this.gameState.selectedCharacterPosition
      );
      await this.performAttack(attackerPositioned, evilPosition);
      const hasEnemies = this.positionedCharacters.some(p =>
        this.evilArrHeroes.includes(p.character.type)
      );
      if (!hasEnemies) {
        if (this.gameState.level >= 4) {
          GamePlay.showMessage('Победа! Вы прошли все уровни!');
          this.gameState.isGameOver = true;
          return;
        };
        this.gameState.level += 1;
        for (const char of this.positionedCharacters) {
          char.character.attack = Math.floor(Math.max(char.character.attack, char.character.attack * (80 + char.character.health) / 100));
          char.character.defense = Math.floor(Math.max(char.character.defense, char.character.defense * (80 + char.character.health) / 100));
          char.character.health = Math.min(100, char.character.health + 80);
          char.character.level += 1;
        };
        this.init();
        return;
      };
      this.gameState.currentPlayer = 'comp';
      await this.makeCompTurn();
      return;
    }

    GamePlay.showError('Невозможно сделать такой ход!');
  }

  onCellEnter(index) {
    const position = this.positionedCharacters.find(char => char.position === index);
    const goodHeroesPos = this.positionedCharacters.find(
      char => char.position === index && this.goodArrHeroes.includes(char.character.type)
    );

    if (position) {
      const player = position.character;
      this.gamePlay.showCellTooltip(this.charInfo`${player.level}${player.attack}${player.defense}${player.health}`, index);
    };

    if (this.gameState.selectedCharacter === null) {
      if (goodHeroesPos) {
        this.gamePlay.setCursor(cursors.pointer);
      } else {
        this.gamePlay.setCursor(cursors.auto);
      }
      return;
    }

    const distanceAttack = this.orientation(this.gameState.selectedCharacterPosition, index, 'attack');
    const distance = this.orientation(this.gameState.selectedCharacterPosition, index, 'move');
    const moveRange = this.possibleMoves(this.gameState.selectedCharacter.type);
    const attackRange = this.possibleAttack(this.gameState.selectedCharacter.type);

    if (distance <= moveRange && distance > 0 && !position) {
      this.gamePlay.selectCell(index, 'green');
      this.gamePlay.setCursor(cursors.pointer);
    } else if (position && this.evilArrHeroes.includes(position.character.type) && distanceAttack <= attackRange && distance > 0) {
      this.gamePlay.selectCell(index, 'red');
      this.gamePlay.setCursor(cursors.crosshair);
    } else {
      this.gamePlay.setCursor(cursors.notallowed);
    }
  }

  onCellLeave(index) {
    this.gamePlay.hideCellTooltip(index);
    if (this.gameState.selectedCharacterPosition !== index) {
      this.gamePlay.deselectCell(index);
    }
  }

  async makeCompTurn() {
    this.gamePlay.setCursor('wait');
    const compChar = this.positionedCharacters.filter(char => this.evilArrHeroes.includes(char.character.type));
    const playerPositions = this.positionedCharacters.filter(char => this.goodArrHeroes.includes(char.character.type));
    const undeads = compChar.filter(p => p.character.type === 'undead');
    const supports = compChar.filter(p => ['vampire', 'daemon'].includes(p.character.type));

    let actionDone = false;
    
    if (!actionDone && undeads.length > 0) {
      for (const undead of undeads) {
        const attackTarget = this.bestAttackTarget(undead, playerPositions);
        if (attackTarget) {
          await this.performAttack(undead, attackTarget);
          if (this.gameState.isGameOver) return;
          actionDone = true;
          break;
        }
    
        const moveRange = this.possibleMoves(undead.character.type);
        const attackRange = this.possibleAttack(undead.character.type);
        let bestMove = null;
    
        for (const player of playerPositions) {
          for (let step = 1; step <= moveRange; step++) {
            const candidate = this.getStepCloser(undead.position, player.position, step);
            const distAfterMove = this.orientation(candidate, player.position, 'attack');
            if (distAfterMove <= attackRange && !this.positionedCharacters.some(p => p.position === candidate)) {
              bestMove = candidate;
              break;
            }
          }
          if (bestMove !== null) break;
        }
    
        if (bestMove !== null) {
          undead.position = bestMove;
          this.gamePlay.redrawPositions(this.positionedCharacters);
          this.updateGameStateCharacters();
          actionDone = true;
          break;
        }
    
        const closestTarget = playerPositions.sort((a, b) =>
            this.orientation(undead.position, a.position, 'move') -
            this.orientation(undead.position, b.position, 'move')
          )[0];
    
        if (closestTarget) {
          const newPos = this.getStepCloser(undead.position, closestTarget.position, moveRange);
          if (!this.positionedCharacters.some(p => p.position === newPos)) {
            undead.position = newPos;
            this.gamePlay.redrawPositions(this.positionedCharacters);
            this.updateGameStateCharacters();
            actionDone = true;
            break;
          }
        }
      }
    }    

    if (!actionDone && supports.length > 0) {
      for (const sup of supports) {
        const target = this.bestAttackTarget(sup, playerPositions);
        if (target) {
          await this.performAttack(sup, target);
          if (this.gameState.isGameOver) return;
          actionDone = true;
          break;
        }
      }
    }

    if (!actionDone) {
      for (const evil of compChar) {
        const moveRange = this.possibleMoves(evil.character.type);
        let bestMove = null;
        let bestDistance = Infinity;
        for (let i = 0; i < 64; i++) {
          const distToCell = this.orientation(evil.position, i, 'move');
          if (distToCell > 0 && distToCell <= moveRange) {
            if (!this.positionedCharacters.some(p => p.position === i)) {
              const closestPlayerDist = Math.min(...playerPositions.map(p => this.orientation(i, p.position)));
              if (closestPlayerDist < bestDistance) {
                bestDistance = closestPlayerDist;
                bestMove = i;
              }
            }
          }
        }
    
        if (bestMove !== null) {
          evil.position = bestMove;
          this.gamePlay.redrawPositions(this.positionedCharacters);
          this.updateGameStateCharacters();
          actionDone = true;
          break;
        }
      }
    }

    this.gameState.currentPlayer = 'player';
  }

  bestAttackTarget(attacker, targets) {
    const range = this.possibleAttack(attacker.character.type);
    return targets.filter(target => {
      const dist = this.orientation(attacker.position, target.position, 'attack');
      return dist <= range && dist > 0;
    }).sort((a, b) => a.character.health - b.character.health)[0];

  }

  async performAttack(attacker, target) {
    const baseDamage = attacker.character.attack - target.character.defense;
    const minDamage = Math.max(5, attacker.character.attack * 0.1);
    const damage = Math.floor(Math.max(baseDamage, minDamage));
  
    await this.gamePlay.showDamage(target.position, damage);
    target.character.health -= damage;
    if (target.character.health <= 0) {
      this.gamePlay.deselectCell(target.position);
      if (this.gameState.selectedCharacterPosition !== null) {
        this.gamePlay.deselectCell(this.gameState.selectedCharacterPosition);
      };        
      this.gameState.selectedCharacterPosition = null;
      this.gameState.selectedCharacter = null;
      this.positionedCharacters = this.positionedCharacters
        .filter(p => p !== target);
    };
    this.gamePlay.redrawPositions(this.positionedCharacters);
    this.updateGameStateCharacters();
    const hasGoods = this.positionedCharacters.some(p =>
      this.goodArrHeroes.includes(p.character.type)
    );
    if (!hasGoods) {
      GamePlay.showMessage('Вы проиграли!');
      this.gameState.isGameOver = true;
    };
  }  

  getStepCloser(fromPos, toPos, maxSteps) {
    const boardSize = 8;
    let row1 = Math.floor(fromPos / boardSize);
    let col1 = fromPos % boardSize;
    const row2 = Math.floor(toPos / boardSize);
    const col2 = toPos % boardSize;
  
    const dRow = row2 > row1 ? 1 : row2 < row1 ? -1 : 0;
    const dCol = col2 > col1 ? 1 : col2 < col1 ? -1 : 0;
  
    const steps = Math.min(maxSteps, Math.max(Math.abs(row2 - row1), Math.abs(col2 - col1)));
  
    const newRow = row1 + dRow * steps;
    const newCol = col1 + dCol * steps;
  
    const finalRow = Math.max(0, Math.min(7, newRow));
    const finalCol = Math.max(0, Math.min(7, newCol));
  
    return finalRow * boardSize + finalCol;
  }

  updateGameStateCharacters() {
    this.gameState.characters = this.positionedCharacters.map(pc => ({
      type: pc.character.type,
      level: pc.character.level,
      health: pc.character.health,
      attack: pc.character.attack,
      defense: pc.character.defense,
      position: pc.position
    }));
  }

  orientation(pos1, pos2, option) {
    const boardSize = 8;
    const row1 = Math.floor(pos1 / boardSize);
    const col1 = pos1 % boardSize;
    const row2 = Math.floor(pos2 / boardSize);
    const col2 = pos2 % boardSize;

    const dRow = Math.abs(row1 - row2);
    const dCol = Math.abs(col1 - col2);
    if (option === 'move') {
      if (!(dRow === 0 || dCol === 0 || dRow === dCol)) {
        return Infinity;
      }
    }
    return Math.max(dRow, dCol);
  }

  possibleMoves(type) {
    switch (type) {
      case 'swordsman':
      case 'undead':
        return 4;
      case 'bowman':
      case 'vampire':
        return 2;
      case 'magician':
      case 'daemon':
        return 1;
    }
  }

  possibleAttack(type) {
    switch (type) {
      case 'swordsman':
      case 'undead':
        return 1;
      case 'bowman':
      case 'vampire':
        return 2;
      case 'magician':
      case 'daemon':
        return 4;
    }
  }
}