function Player(name) {
    this.name = name;
}

function Turn(player, playerScores) {
    this.player = player;
    this.playerScores = playerScores;
}

function Match(players, targetScore = 60) {
    this.players = players;
    this.targetScore = targetScore;
    this.turns = [];
}

Match.prototype.getScoreForPlayer = function(player) {
    var score = 0;
    for(var i = 0; i < this.turns.length; i++)
    {
        var turnScore = this.turns[i].playerScores.get(player);
        if(turnScore != undefined)
            score += turnScore;
    }
    return score;
}

Match.prototype.getWinningPlayer = function() {
    var player = this.players.find(player => this.getScoreForPlayer(player) >= this.targetScore);
    if(player != undefined)
        return player;
    return null;
}

function TurnHistoryDiv(match)
{
    this.match = match;
    this.historyScrollDiv = document.createElement("div");
    this.historyScrollDiv.classList.add("history_scroll");
    this.historyContainerDiv = document.createElement("div");
    this.historyDiv = document.createElement("div");
    this.historyDiv.classList.add("history");
    this.historyContainerDiv.appendChild(this.historyDiv);
    this.historyScrollDiv.appendChild(this.historyContainerDiv);
    var playersDiv = document.createElement("div");
    playersDiv.classList.add("players");
    for(var i = 0; i < 2; i++)
    {
        var playerSpan = document.createElement("span");
        playerSpan.classList.add("player");
        playerSpan.textContent = this.match.players[i].name;
        playersDiv.appendChild(playerSpan);
    }
    this.historyDiv.appendChild(playersDiv);
    this.turnsDiv = document.createElement("div");
    this.historyDiv.appendChild(this.turnsDiv);
    this.match.turns.forEach(turn => this.turnAdded(turn, true));
    this.resizeWidth();
}

TurnHistoryDiv.prototype.turnAdded = function(turn, dontResize = false) {
    var turnElement = document.createElement("div");
    turnElement.classList.add("turn");
    for(var i = 0; i < 2; i++) {
        var player = this.match.players[i];

        var scoreElement = document.createElement("span");
        scoreElement.classList.add("turn_score");
        var playerTurnScore = turn.playerScores.get(player);
        if(playerTurnScore != undefined) {
            scoreElement.textContent = (playerTurnScore > 0 ? "+" : "") + playerTurnScore;

            if(turn.player != player)
                scoreElement.classList.add("foul");
            else if(playerTurnScore > 0)
                scoreElement.classList.add("positive");
            else if(playerTurnScore < 0)
                scoreElement.classList.add("negative");
        }

        turnElement.appendChild(scoreElement);
    }
    this.turnsDiv.prepend(turnElement);
    app.requestScreenAnimationFrame(() => this.resizeWidth());
}

TurnHistoryDiv.prototype.resizeWidth = function() {
    var scrollbarOffset = this.historyScrollDiv.offsetWidth - this.historyScrollDiv.scrollWidth;
    this.historyContainerDiv.style.width = this.historyScrollDiv.offsetWidth + "px";
}

function MainScreen() {
    this.__proto__.__proto__.constructor.call(this);

    this.contentId = "main";
}

MainScreen.prototype.__proto__ = AppScreen.prototype;

MainScreen.prototype.newMatchClicked = function() {
    app.loadScreen(new NewMatchScreen(null));
}

function NewMatchScreen(match) {
    this.__proto__.__proto__.constructor.call(this);

    this.contentId = "new_match";

    this.nameRegex = /[\w\s]+/;
    this.match = match;
}

NewMatchScreen.prototype.__proto__ = AppScreen.prototype;

NewMatchScreen.prototype.onStart = function() {
    document.getElementById("player1label").textContent = app.resourceManager.getFormattedString("player", "1");
    document.getElementById("player2label").textContent = app.resourceManager.getFormattedString("player", "2");
    if(this.match != null)
    {
        document.getElementById("title").textContent = app.resourceManager.strings.get("editmatch");
        document.getElementById("player1").value = this.match.players[0].name;
        document.getElementById("player2").value = this.match.players[1].name;
        var targetScoreInput = document.getElementById("targetScore");
        targetScoreInput.value = this.match.targetScore;
        targetScoreInput.setAttribute("readonly", "");
        document.getElementById("startButton").value = app.resourceManager.strings.get("save");
        document.getElementById("backButton").textContent = app.resourceManager.strings.get("cancel");
    }
}

NewMatchScreen.prototype.checkName = function(name) {
    var result = name.match(this.nameRegex);
    if(result == null)
        return false;
    return result[0] == name;
}

NewMatchScreen.prototype.formSubmit = function() {
    var formData = new FormData(document.getElementById("playersForm"));
    var playerNames = [formData.get("player1").trim(), formData.get("player2").trim()];
    var targetScore = parseInt(formData.get("targetScore"));
    var errorLabel = document.getElementById("errorLabel");
    for(var i = 0; i < playerNames.length; i++)
    {
        if(playerNames[i] == "")
        {
            errorLabel.textContent = app.resourceManager.getFormattedString("insertName", i + 1);
            return false;
        }
        if(!this.checkName(playerNames[i]))
        {
            errorLabel.textContent = app.resourceManager.getFormattedString("invalidName", i + 1);
            return false;
        }
    }
    if(isNaN(targetScore))
    {
        errorLabel.textContent = app.resourceManager.strings.get("invalidTargetScoreNumber");
        return false;
    }
    if(targetScore < 1)
    {
        errorLabel.textContent = app.resourceManager.strings.get("invalidTargetScoreGreaterThanZero");
        return false;
    }
    if(this.match == null)
    {
        this.match = new Match([new Player(playerNames[0]), new Player(playerNames[1])], targetScore);
    }
    else
    {
        this.match.players[0].name = playerNames[0];
        this.match.players[1].name = playerNames[1];
    }
    app.loadScreen(new MatchScreen(this.match));
    return false;
}

NewMatchScreen.prototype.backClicked = function() {
    if(this.match == null)
        app.loadScreen(new MainScreen());
    else
        app.loadScreen(new MatchScreen(this.match));
}

function MatchScreen(match) {
    this.__proto__.__proto__.constructor.call(this);

    this.contentId = "match";

    this.match = match;
    this.activePlayer = -1;
    this.newScoreMode = 1;
    this.newScore = 0;
}

MatchScreen.prototype.__proto__ = AppScreen.prototype;

MatchScreen.prototype.onStart = function() {    
    this.scoreHolders = [document.getElementById("player1ScoreHolder"), document.getElementById("player2ScoreHolder")];
    this.scoreLabels = [document.getElementById("player1Score"), document.getElementById("player2Score")];
    this.buttonsDiv = document.getElementById("buttons");
    this.inputText = document.getElementById("inputText");
    this.signButton = document.getElementById("signButton");
    this.turnHistoryDiv = new TurnHistoryDiv(this.match);

    document.getElementById("player1Name").textContent = this.match.players[0].name;
    document.getElementById("player2Name").textContent = this.match.players[1].name;
    this.updateScoreLabel(0);
    this.updateScoreLabel(1);
    document.getElementById("bottom").prepend(this.turnHistoryDiv.historyScrollDiv);
    
    this.resizeUI();
}

MatchScreen.prototype.onResize = function() {
    this.resizeUI();
}

MatchScreen.prototype.onKeyDown = function(event) {
    if(this.activePlayer != -1) {
        switch(event.key) {
            case "1":
                this.addNewScoreDigit(1);
                break;
            case "2":
                this.addNewScoreDigit(2);
                break;
            case "3":
                this.addNewScoreDigit(3);
                break;
            case "4":
                this.addNewScoreDigit(4);
                break;
            case "5":
                this.addNewScoreDigit(5);
                break;
            case "6":
                this.addNewScoreDigit(6);
                break;
            case "7":
                this.addNewScoreDigit(7);
                break;
            case "8":
                this.addNewScoreDigit(8);
                break;
            case "9":
                this.addNewScoreDigit(9);
                break;
            case "0":
                this.addNewScoreDigit(0);
                break;
            case "+":
                this.setNewScoreMode(1);
                break;
            case "-":
                this.setNewScoreMode(-1);
                break;
            case "F":
            case "f":
                this.setNewScoreMode(0);
                break;
            case "Enter":
                if(app.usingMouseControls) {
                    this.addNewScore();
                    event.preventDefault();
                }
                break;
        }
    }
}

MatchScreen.prototype.setActivePlayer = function(playerIndex) {
    if(this.activePlayer != -1)
        this.scoreHolders[this.activePlayer].classList.remove("active");
    this.activePlayer = playerIndex;
    if(this.activePlayer != -1)
    {
        this.scoreHolders[this.activePlayer].classList.add("active");
        this.newScoreMode = 1;
        this.newScore = 0;
        this.signButton.textContent = "+";
        this.updateInputText();
        this.turnHistoryDiv.historyScrollDiv.style.display = "none";
        this.buttonsDiv.style.display = "block";
    }
    else
    {
        this.buttonsDiv.style.display = "none";
        this.turnHistoryDiv.historyScrollDiv.style.display = "block";
    }
}

MatchScreen.prototype.addNewScoreDigit = function(digit) {
    this.newScore = this.newScore * 10 + digit;
    this.updateInputText();
}

MatchScreen.prototype.setNewScoreMode = function(mode) {
    this.newScoreMode = mode;
    this.updateInputText();
    switch(this.newScoreMode) {
        case -1:
            this.signButton.textContent = "-";
            break;
        case 0:
            this.signButton.textContent = "F";
            break;
        case 1:
            this.signButton.textContent = "+";
            break;
    }
}

MatchScreen.prototype.addNewScore = function() {
    var scorePlayerIndex;
    var score = this.newScore;
    if(this.newScoreMode == 0) {
        scorePlayerIndex = Math.abs(this.activePlayer - 1);
    }
    else {
        scorePlayerIndex = this.activePlayer;
        score *= this.newScoreMode;
    }
    var turn = new Turn(this.match.players[this.activePlayer], new Map([[this.match.players[scorePlayerIndex], score]]));
    this.match.turns.push(turn);
    this.updateScoreLabel(scorePlayerIndex);
    this.turnHistoryDiv.turnAdded(turn);
    this.setActivePlayer(-1);
    if(this.match.getWinningPlayer() != null)
        app.loadScreen(new WinScreen(this.match));
}

MatchScreen.prototype.exitClicked = function() {
    app.loadScreen(new MainScreen());
}

MatchScreen.prototype.editClicked = function() {
    app.loadScreen(new NewMatchScreen(this.match));
}

MatchScreen.prototype.playerClicked = function(playerIndex) {
    if(playerIndex == this.activePlayer)
        this.setActivePlayer(-1);
    else
        this.setActivePlayer(playerIndex);
}

MatchScreen.prototype.numberClicked = function(number) {
    this.addNewScoreDigit(number);
}

MatchScreen.prototype.signClicked = function() {
    this.newScoreMode++;
    if(this.newScoreMode > 1)
        this.newScoreMode = -1;
    this.setNewScoreMode(this.newScoreMode);
}

MatchScreen.prototype.sendClicked = function() {
    this.addNewScore();
}

MatchScreen.prototype.updateInputText = function() {
    this.inputText.textContent = (this.newScoreMode == -1 ? "-" : "") + this.newScore;
}

MatchScreen.prototype.updateScoreLabel = function(playerIndex) {
    this.scoreLabels[playerIndex].textContent = this.match.getScoreForPlayer(this.match.players[playerIndex]);
}

MatchScreen.prototype.resizeUI = function() {
    var scoresHeight = document.body.clientHeight - document.getElementsByClassName("top_buttons")[0].clientHeight - document.getElementsByClassName("bottom")[0].clientHeight;
    document.getElementsByClassName("scores")[0].style.height = scoresHeight + "px";
    var playerNames = document.getElementsByClassName("player_name");
    for(var i = 0; i < playerNames.length; i++)
    {
        var textHeight = playerNames[i].clientHeight + "px";
        playerNames[i].style.fontSize = textHeight;
        playerNames[i].style.lineHeight = textHeight;
    }
    var scores = document.getElementsByClassName("score");
    for(var i = 0; i < scores.length; i++)
    {
        var textHeight = scores[i].clientHeight + "px";
        scores[i].style.fontSize = textHeight;
        scores[i].style.lineHeight = textHeight;
    }
    this.turnHistoryDiv.resizeWidth();
}

function WinScreen(match) {
    this.__proto__.__proto__.constructor(this);

    this.contentId = "win";

    this.match = match;
}

WinScreen.prototype.__proto__ = AppScreen.prototype;

WinScreen.prototype.onStart = function() {
    document.getElementById("winLabel").textContent = app.resourceManager.getFormattedString("playerWon", this.match.getWinningPlayer().name);
    document.getElementById("player1Name").textContent = this.match.players[0].name;
    document.getElementById("player2Name").textContent = this.match.players[1].name;
    document.getElementById("player1Score").textContent = this.match.getScoreForPlayer(this.match.players[0]);
    document.getElementById("player2Score").textContent = this.match.getScoreForPlayer(this.match.players[1]);
    this.turnHistoryDiv = new TurnHistoryDiv(this.match);
    this.turnHistoryDiv.historyScrollDiv.classList.add("win_history_scroll");
    this.turnHistoryDiv.historyDiv.classList.add("win_history");
    var undoButton = document.getElementById("undoButton");
    undoButton.parentElement.insertBefore(this.turnHistoryDiv.historyScrollDiv, undoButton);
    this.turnHistoryDiv.resizeWidth();
}

WinScreen.prototype.onResize = function() {
    this.turnHistoryDiv.resizeWidth();
}

WinScreen.prototype.undoClicked = function() {
    this.match.turns.pop();
    app.loadScreen(new MatchScreen(this.match));
}

WinScreen.prototype.finishClicked = function() {
    app.loadScreen(new MainScreen());
}

app.supportedLocales = ["it-IT"];
app.localeAliases.set("it", "it-IT");

app.onstart = function() {
    app.loadScreen(new MainScreen());
}