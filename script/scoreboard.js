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

function MainScreen() {
    this.__proto__.__proto__.constructor.call(this);

    this.contentId = "main";
}

MainScreen.prototype.__proto__ = AppScreen.prototype;

MainScreen.prototype.newMatchClicked = function() {
    app.loadScreen(new NewMatchScreen());
}

function NewMatchScreen() {
    this.__proto__.__proto__.constructor.call(this);

    this.contentId = "new_match";
    this.nameRegex = /[\w\s]+/;
}

NewMatchScreen.prototype.__proto__ = AppScreen.prototype;

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
        console.log(playerNames[i]);
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
    app.loadScreen(new MatchScreen(playerNames));
    return false;
}

NewMatchScreen.prototype.backClicked = function() {
    app.loadScreen(new MainScreen());
}

function MatchScreen(match) {
    this.__proto__.__proto__.constructor.call(this);

    this.contentId = "match";

    this.match = match;
    this.activePlayer = -1;
}

MatchScreen.prototype.__proto__ = AppScreen.prototype;

MatchScreen.prototype.onStart = function() {
    this.resizeUI();
    
    this.scoreHolders = [document.getElementById("player1ScoreHolder"), document.getElementById("player2ScoreHolder")];
    this.scoreLabels = [document.getElementById("player1Score"), document.getElementById("player2Score")];
    this.buttonsDiv = document.getElementById("buttons");
    this.inputText = document.getElementById("inputText");

    document.getElementById("player1Name").textContent = this.match.players[0].name;
    document.getElementById("player2Name").textContent = this.match.players[1].name;
    this.updateScoreLabel(0);
    this.updateScoreLabel(1);
}

MatchScreen.prototype.onResize = function() {
    this.resizeUI();
}

MatchScreen.prototype.playerClicked = function(playerIndex) {
    if(this.activePlayer != -1)
        this.scoreHolders[this.activePlayer].classList.remove("active");
    if(this.activePlayer != playerIndex)
    {
        this.activePlayer = playerIndex;
        this.scoreHolders[this.activePlayer].classList.add("active");
        this.buttonsDiv.style.visibility = "visible";
    }
    else
    {
        this.activePlayer = -1;
        this.buttonsDiv.style.visibility = "hidden";
    }
}

MatchScreen.prototype.updateScoreLabel = function(playerIndex) {
    this.scoreLabels[playerIndex].textContent = this.match.getScoreForPlayer(this.match.players[playerIndex]);
}

MatchScreen.prototype.resizeUI = function() {
    var scoresHeight = document.body.clientHeight - document.getElementsByClassName("top_buttons")[0].clientHeight - document.getElementsByClassName("buttons")[0].clientHeight - 2;
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
}

window.addEventListener("load", function() {
    app.loadScreen(new MatchScreen(new Match([new Player("Player 1"), new Player("Player 2")])));
});