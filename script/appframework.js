var app = {};
app.screenResources = new Map();

app.loadResources = function() {
    var screenResourcesDiv = document.getElementById("screenResources");
    screenResourcesDiv.childNodes.forEach(res => this.screenResources.set(res.id, res));
    screenResourcesDiv.remove();
}

app.loadScreen = function(screen) {
    var currentScreenDiv = document.getElementById("screen");
    if(currentScreenDiv != null) {
        currentScreenDiv.remove();
    }

    this.currentScreen = screen;

    if(screen.contentId != null)
    {
        var newScreenDiv = this.screenResources.get(screen.contentId).cloneNode(true);
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

window.addEventListener("load", function() {
    app.loadResources();
});

window.addEventListener("resize", (e) => app.onResize(e));

function AppScreen() {
    this.contentId = null;
}

AppScreen.prototype.onStart = function() {

}

AppScreen.prototype.onResize = function() {

}