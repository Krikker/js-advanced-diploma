export default class GameState {
  constructor() {
    this.currentPlayer = 'player';
    this.selectedCharacter = null;
    this.selectedCharacterPosition = null;
    this.level = 1;
    this.isGameOver = false;
    this.characters = [];
  }

  static from(object) {
    if (!object) return new GameState();
    const state = new GameState();
    state.currentPlayer = object.currentPlayer;
    state.selectedCharacter = object.selectedCharacter;
    state.selectedCharacterPosition = object.selectedCharacterPosition;
    state.level = object.level;
    state.isGameOver = object.isGameOver;
    state.characters = object.characters;
    return state;
  }
}
