function Player(name) {
    this.name = name;
}

function Turn(player, score) {
    this.player = player;
    this.score = score;
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
        if(this.turns[i].player == player)
            score += this.turns[i].score;
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
    var playerIndex = this.match.players.findIndex(player => player == turn.player);
    var turnElement = document.createElement("div");
    turnElement.classList.add("turn");
    for(var i = 0; i < 2; i++)
    {
        var scoreElement = document.createElement("span");
        scoreElement.classList.add("turn_score");
        if(playerIndex == i)
            scoreElement.textContent = (turn.score > 0 ? "+" : "") + turn.score;
        if(turn.score > 0)
            scoreElement.classList.add("positive");
        else if(turn.score < 0)
            scoreElement.classList.add("negative");
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
    if(this.match != null)
    {
        document.getElementById("title").textContent = "Edit match";
        document.getElementById("player1").value = this.match.players[0].name;
        document.getElementById("player2").value = this.match.players[1].name;
        document.getElementById("startButton").value = "Save";
        document.getElementById("backButton").textContent = "Cancel";
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
    var errorLabel = document.getElementById("errorLabel");
    for(var i = 0; i < playerNames.length; i++)
    {
        if(playerNames[i] == "")
        {
            errorLabel.textContent = "Insert a name for player " + (i + 1) + ".";
            return false;
        }
        if(!this.checkName(playerNames[i]))
        {
            errorLabel.textContent = "Invalid name for player " + (i + 1) + ": only alphanumeric and whitespace characters are accepted.";
            return false;
        }
    }
    if(this.match == null)
    {
        this.match = new Match([new Player(playerNames[0]), new Player(playerNames[1])]);
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
    this.newScoreSign = 1;
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

MatchScreen.prototype.setActivePlayer = function(playerIndex) {
    if(this.activePlayer != -1)
        this.scoreHolders[this.activePlayer].classList.remove("active");
    this.activePlayer = playerIndex;
    if(this.activePlayer != -1)
    {
        this.scoreHolders[this.activePlayer].classList.add("active");
        this.newScoreSign = 1;
        this.newScore = 0;
        this.signButton.textContent = "-";
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
    this.newScore = this.newScore * 10 + number;
    this.updateInputText();
}

MatchScreen.prototype.signClicked = function() {
    this.newScoreSign *= -1;
    this.updateInputText();
    this.signButton.textContent = this.newScoreSign == 1 ? "-" : "+";
}

MatchScreen.prototype.sendClicked = function() {
    var turn = new Turn(this.match.players[this.activePlayer], this.newScore * this.newScoreSign);
    this.match.turns.push(turn);
    this.updateScoreLabel(this.activePlayer);
    this.turnHistoryDiv.turnAdded(turn);
    this.setActivePlayer(-1);
    if(this.match.getWinningPlayer() != null)
        app.loadScreen(new WinScreen(this.match));
}

MatchScreen.prototype.updateInputText = function() {
    this.inputText.textContent = (this.newScoreSign == -1 ? "-" : "") + this.newScore;
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
    document.getElementById("winLabel").textContent = this.match.getWinningPlayer().name + " won!";
    document.getElementById("player1Name").textContent = this.match.players[0].name;
    document.getElementById("player2Name").textContent = this.match.players[1].name;
    document.getElementById("player1Score").textContent = this.match.getScoreForPlayer(this.match.players[0]);
    document.getElementById("player2Score").textContent = this.match.getScoreForPlayer(this.match.players[1]);
    var turnHistoryDiv = new TurnHistoryDiv(this.match);
    turnHistoryDiv.historyScrollDiv.classList.add("win_history_scroll");
    turnHistoryDiv.historyDiv.classList.add("win_history");
    var undoButton = document.getElementById("undoButton");
    undoButton.parentElement.insertBefore(turnHistoryDiv.historyScrollDiv, undoButton);
    turnHistoryDiv.resizeWidth();
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

app.onstart = function() {
    app.loadScreen(new MainScreen());
}