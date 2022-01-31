function MatchParty(name, players = []) {
    this.name = name;
    this.players = players;
}

function Player(name) {
    this.__proto__.__proto__.constructor.call(this, name, [this]);
}

Player.prototype.__proto__ = MatchParty.prototype;

function Team(name, players) {
    this.__proto__.__proto__.constructor.call(this, name, players);
}

Team.prototype.__proto__ = MatchParty.prototype;

function ScoreMode() { }

Object.defineProperty(ScoreMode, "Positive", {
    value: new ScoreMode(),
    writable: false,
    enumerable: true,
    configurable: false
});

Object.defineProperty(ScoreMode, "Negative", {
    value: new ScoreMode(),
    writable: false,
    enumerable: true,
    configurable: false
});

Object.defineProperty(ScoreMode, "Foul", {
    value: new ScoreMode(),
    writable: false,
    enumerable: true,
    configurable: false
});

function Score(mode, amount) {
    this.mode = mode;
    this.amount = amount;
}

function Turn(player, partyScores, playerScores) {
    this.player = player;
    this.partyScores = partyScores;
    this.playerScores = playerScores;
}

function Match(parties, targetScore = 60) {
    this.parties = parties;
    this.targetScore = targetScore;
    this.turns = [];
}

Match.prototype.getScoreForParty = function(party) {
    var score = 0;
    this.turns.forEach(turn => {
        var partyTurnScores = turn.partyScores.get(party);
        if(partyTurnScores != undefined) {
            partyTurnScores.foreach(partyTurnScore => {
                if(partyTurnScore.mode == ScoreMode.Positive)
                    score += partyTurnScore.amount;
                else if(partyTurnScore.mode == ScoreMode.Negative)
                    score -= partyTurnScore.amount;
            });
        }

        turn.playerScores.forEach((turnScores, player) => {
            if(party.players.includes(player)) {
                turnScores.forEach(turnScore => {
                    if(turnScore.mode == ScoreMode.Positive)
                        score += turnScore.amount;
                    else if(turnScore.mode == ScoreMode.Negative)
                        score -= turnScore.amount;
                });
            }
            else {
                turnScores.filter(turnScore => turnScore.mode == ScoreMode.Foul).forEach(turnScore => score += turnScore.amount);
            }
        });
    });
    return score;
}

Match.prototype.getScoreForPlayer = function(player) {
    var score = 0;
    this.turns.forEach(turn => {
        var turnScores = turn.playerScores.get(player);
        if(turnScores != undefined)
            turnScores.forEach(turnScore => {
                if(turnScore.mode == ScoreMode.Positive)
                    score += turnScore.amount;
                else if(turnScore.mode == ScoreMode.Negative)
                    score -= turnScore.amount;
            });
    });
    return score;
}

Match.prototype.getWinningParty = function() {
    var party = this.parties.find(party => this.getScoreForParty(party) >= this.targetScore);
    if(party != undefined)
        return party;
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
        playerSpan.textContent = this.match.parties[i].name;
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
        var player = this.match.parties[i];

        var scoreElement = document.createElement("span");
        scoreElement.classList.add("turn_score");
        var playerTurnScores = turn.playerScores.get(player);
        if(playerTurnScores != undefined && playerTurnScores.length >= 1) {
            var scoreString = "";
            if(playerTurnScores[0].mode == ScoreMode.Positive)
                scoreString = "+";
            else if(playerTurnScores[0].mode == ScoreMode.Negative)
                scoreString = "-";
            scoreString += playerTurnScores[0].amount;
            scoreElement.textContent = scoreString;

            if(playerTurnScores[0].mode == ScoreMode.Positive)
                scoreElement.classList.add("positive");
            else if(playerTurnScores[0].mode == ScoreMode.Negative)
                scoreElement.classList.add("negative");
            else
                scoreElement.classList.add("foul");
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
        document.getElementById("player1").value = this.match.parties[0].name;
        document.getElementById("player2").value = this.match.parties[1].name;
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
        this.match.parties[0].name = playerNames[0];
        this.match.parties[1].name = playerNames[1];
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
    this.activePlayerIndex = null;
    this.newScore = new Score(ScoreMode.Positive, 0);
}

MatchScreen.prototype.__proto__ = AppScreen.prototype;

MatchScreen.prototype.onStart = function() {    
    this.scoreHolders = [[document.getElementById("player1ScoreHolder")], [document.getElementById("player2ScoreHolder")]];
    this.scoreLabels = [[document.getElementById("player1Score")], [document.getElementById("player2Score")]];
    this.buttonsDiv = document.getElementById("buttons");
    this.inputText = document.getElementById("inputText");
    this.signButton = document.getElementById("signButton");
    this.turnHistoryDiv = new TurnHistoryDiv(this.match);

    document.getElementById("player1Name").textContent = this.match.parties[0].name;
    document.getElementById("player2Name").textContent = this.match.parties[1].name;
    this.updateScoreLabels();
    document.getElementById("bottom").prepend(this.turnHistoryDiv.historyScrollDiv);
    
    this.resizeUI();
}

MatchScreen.prototype.onResize = function() {
    this.resizeUI();
}

MatchScreen.prototype.onKeyDown = function(event) {
    if(this.activePlayerIndex != null) {
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
                this.setNewScoreMode(ScoreMode.Positive);
                break;
            case "-":
                this.setNewScoreMode(ScoreMode.Negative);
                break;
            case "F":
            case "f":
                this.setNewScoreMode(ScoreMode.Foul);
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

MatchScreen.prototype.setActivePlayer = function(activePlayer) {
    if(this.activePlayerIndex != null)
        this.scoreHolders[this.activePlayerIndex[0]][this.activePlayerIndex[1]].classList.remove("active");
    this.activePlayerIndex = activePlayer;
    if(this.activePlayerIndex != null)
    {
        this.scoreHolders[this.activePlayerIndex[0]][this.activePlayerIndex[1]].classList.add("active");
        this.newScore = new Score(ScoreMode.Positive, 0);
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
    this.newScore.amount = this.newScore.amount * 10 + digit;
    this.updateInputText();
}

MatchScreen.prototype.setNewScoreMode = function(mode) {
    this.newScore.mode = mode;
    this.updateInputText();
    switch(this.newScore.mode) {
        case ScoreMode.Positive:
            this.signButton.textContent = "+";
            break;
        case ScoreMode.Negative:
            this.signButton.textContent = "-";
            break;
        case ScoreMode.Foul:
            this.signButton.textContent = "F";
            break;
    }
}

MatchScreen.prototype.addNewScore = function() {
    var turn = new Turn(this.match.parties[this.activePlayerIndex[0]].players[this.activePlayerIndex[1]], new Map(), new Map([[this.match.parties[this.activePlayerIndex[0]].players[this.activePlayerIndex[1]], [this.newScore]]]));
    this.match.turns.push(turn);
    this.updateScoreLabels();
    this.turnHistoryDiv.turnAdded(turn);
    this.setActivePlayer(null);
    if(this.match.getWinningParty() != null)
        app.loadScreen(new WinScreen(this.match));
}

MatchScreen.prototype.exitClicked = function() {
    app.loadScreen(new MainScreen());
}

MatchScreen.prototype.editClicked = function() {
    app.loadScreen(new NewMatchScreen(this.match));
}

MatchScreen.prototype.playerClicked = function(playerIndex) {
    if(this.activePlayerIndex != null && playerIndex[0] == this.activePlayerIndex[0] && playerIndex[1] == this.activePlayerIndex[1])
        this.setActivePlayer(null);
    else
        this.setActivePlayer(playerIndex);
}

MatchScreen.prototype.numberClicked = function(number) {
    this.addNewScoreDigit(number);
}

MatchScreen.prototype.signClicked = function() {
    switch(this.newScore.mode) {
        case(ScoreMode.Positive):
            this.setNewScoreMode(ScoreMode.Negative);
            break;
        case(ScoreMode.Negative):
            this.setNewScoreMode(ScoreMode.Foul);
            break;
        case(ScoreMode.Foul):
            this.setNewScoreMode(ScoreMode.Positive);
            break;
    }
}

MatchScreen.prototype.sendClicked = function() {
    this.addNewScore();
}

MatchScreen.prototype.updateInputText = function() {
    this.inputText.textContent = (this.newScore.mode == ScoreMode.Negative ? "-" : "") + this.newScore.amount;
}

MatchScreen.prototype.updateScoreLabels = function() {
    this.scoreLabels[0][0].textContent = this.match.getScoreForParty(this.match.parties[0]);
    this.scoreLabels[1][0].textContent = this.match.getScoreForParty(this.match.parties[1]);
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
    document.getElementById("winLabel").textContent = app.resourceManager.getFormattedString("playerWon", this.match.getWinningParty().name);
    document.getElementById("player1Name").textContent = this.match.parties[0].name;
    document.getElementById("player2Name").textContent = this.match.parties[1].name;
    document.getElementById("player1Score").textContent = this.match.getScoreForParty(this.match.parties[0]);
    document.getElementById("player2Score").textContent = this.match.getScoreForParty(this.match.parties[1]);
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