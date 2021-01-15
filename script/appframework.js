var app = {};

app.loadScreen = function(screen) {
    var currentScreenDiv = document.getElementById("screen");
    if(currentScreenDiv != null) {
        currentScreenDiv.remove();
    }

    this.currentScreen = screen;

    if(screen.contentId != null)
    {
        var newScreenDiv = document.getElementById(screen.contentId).cloneNode(true);
        newScreenDiv.id = "screen";
        document.body.prepend(newScreenDiv);
    }

    this.currentScreen.onStart();
}

app.onResize = function(event) {
    if(this.currentScreen != null)
    {
        this.currentScreen.onResize();
    }
}

window.addEventListener("resize", (e) => app.onResize(e));

function AppScreen() {
    this.contentId = null;
}

AppScreen.prototype.onStart = function() {

}

AppScreen.prototype.onResize = function() {

}