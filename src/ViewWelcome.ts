export class ViewWelcome {
  public showWelcomeScreen(): void {
    const playerInfoContainer = document.getElementById('playerInfo');
    if (playerInfoContainer) {
      playerInfoContainer.innerHTML = this.getInfoPanelContents();
    }

    const questInfoContainer = document.getElementById('questInfo');
    if (questInfoContainer) {
      questInfoContainer.innerHTML = this.getQuestPanelContents();
    }

    const phaseDisplay = document.getElementById('phaseDisplay');
    if (phaseDisplay) {
      phaseDisplay.innerHTML = this.getPhasePanelContents();
    }

    const hexMapContainer = document.getElementById('hexMapSVG');
    if (hexMapContainer) {
      hexMapContainer.innerHTML = this.getMapPanelContents();
    }

    const newGameButton = document.getElementById('newGame');
    if (newGameButton) {
      newGameButton.style.visibility = 'hidden';
    }
  }

  public getInfoPanelContents(): string {
    return `
        <div class="welcome-screen">
          <h3>Welcome to Quests of Zeus</h3>
          <p>A strategic board game of ancient Greece</p>
      </div>`;
  }

  public getQuestPanelContents(): string {
    return ``;
  }

  public getPhasePanelContents(): string {
    return `
        <div class="phase-info">
          <h3>Ready to Begin</h3>
          <p>Click "Start New Game" to begin your adventure!</p>
          <button id="startGame" class="action-button">Start New Game</button>
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
