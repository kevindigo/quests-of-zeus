export class ViewWelcome {
  public getInfoPanelContents(): string {
    return `
        <div class="welcome-screen">
          <h3>Welcome to Quests of Zeus</h3>
          <p>A strategic board game of ancient Greece</p>
          <button id="startGame" class="action-btn">Start New Game</button>
      `;
  }

  public getQuestPanelContents(): string {
    return `
        <div class="game-rules">
          <h3>Game Rules</h3>
          <div class="rules-section">
            <h4>Phases:</h4>
            <ul>
              <li><strong>Action Phase:</strong> Select a die and perform actions (move, collect offerings, fight monsters, etc.)</li>
              <li><strong>End of Turn:</strong> Dice are automatically rolled for the next player</li>
              <li>You can change your selected die before making a move</li>
              <li>You can recolor dice and oracle cards by spending favor (1 favor per color advancement)</li>
              <li>Color wheel: black → pink → blue → yellow → green → red → black</li>
            </ul>
          </div>
        </div>
      `;
  }

  public getPhasePanelContents(): string {
    return `
        <div class="phase-info">
          <h3>Ready to Begin</h3>
          <p>Click "Start New Game" to begin your adventure!</p>
        </div>
      `;
  }

  public getMapPanelContents(): string {
    return `
        <div class="welcome-map">
          <p>Game map will appear here when you start a new game</p>
        </div>
      `;
  }
}
