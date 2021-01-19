function RequestPromise(location, onSuccess)
{
    this.complete = false;
    this.awaiter = null;

    this.request = new XMLHttpRequest();
    this.request.onreadystatechange = () => {
        if(this.request.readyState == XMLHttpRequest.DONE) {
            if((this.request.status >= 200 && this.request.status < 300) || this.request.status == 304) {
                onSuccess(this.request);
            }
            this.complete = true;
            if(this.awaiter != null) {
                this.awaiter(this);
            }
        }
    };
    this.request.open("GET", location);
    this.request.setRequestHeader("Cache-Control", "no-cache");
    this.request.send();
}

RequestPromise.prototype.setAwaiter = function(callback) {
    if(this.complete)
        callback(this);
    else
        this.awaiter = callback;
}

RequestPromise.waitAll = function(promises, callback) {
    var incompletePromises = [];
    promises.forEach(promise => incompletePromises.push(promise));
    promises.forEach(promise => promise.setAwaiter(() => {
        if(incompletePromises.every(p => p.complete))
            callback();
    }));
}

function ResourceManager() {
    this.screens = new Map();
    this.strings = new Map();
}

ResourceManager.prototype.loadResources = function(locale, onLoaded) {
    var screenResourcesDiv = document.getElementById("screenResources");
    screenResourcesDiv.childNodes.forEach(res => this.screens.set(res.id, res));
    screenResourcesDiv.remove();

    var loadPromises = [];
    loadPromises.push(new RequestPromise("res/strings/strings.json", (request) => {
        this.strings = new Map(JSON.parse(request.responseText));
    }));

    if(locale != null)
    {
        loadPromises.push(new RequestPromise("res/" + locale + "/strings/strings.json", (request) => {
            this.updateMap(this.strings, JSON.parse(request.responseText));
        }));
    }

    RequestPromise.waitAll(loadPromises, () => { if(onLoaded != null) onLoaded(); });
}

ResourceManager.prototype.updateMap = function(map, entries) {
    entries.forEach(entry => map.set(entry[0], entry[1]));
}

var app = {};
app.onstart = null;
app.resourceManager = new ResourceManager();

app.loadScreen = function(screen) {
    var currentScreenDiv = document.getElementById("screen");
    if(currentScreenDiv != null) {
        currentScreenDiv.remove();
    }

    this.currentScreen = screen;

    if(screen.contentId != null)
    {
        var newScreenDiv = this.resourceManager.screens.get(screen.contentId).cloneNode(true);
        newScreenDiv.id = "screen";
        this.initializeElement(newScreenDiv);
        document.body.prepend(newScreenDiv);
    }

    this.currentScreen.onStart();
}

app.requestScreenAnimationFrame = function(callback) {
    var callingScreen = this.currentScreen;
    window.requestAnimationFrame((t) => {
        if(callingScreen == this.currentScreen)
            callback(t);
    });
}

app.initializeElement = function(element) {
    if(element.nodeType == Node.TEXT_NODE && element.textContent.startsWith("@res:")) {
        var resourceId = element.textContent.substring(5);
        element.textContent = this.resourceManager.strings.get(resourceId);
    }
    else if (element.nodeName == "INPUT" && element.value.startsWith("@res:")) {
        var resourceId = element.value.substring(5);
        element.value = this.resourceManager.strings.get(resourceId);
    }
    element.childNodes.forEach(child => this.initializeElement(child));
}

app.onResize = function(event) {
    if(this.currentScreen != null)
    {
        this.currentScreen.onResize();
    }
}

window.addEventListener("load", function() {
    app.resourceManager.loadResources(null, () => { if(app.onstart != null) app.onstart(); })
});

window.addEventListener("resize", (e) => app.onResize(e));

function AppScreen() {
    this.contentId = null;
}

AppScreen.prototype.onStart = function() {

}

AppScreen.prototype.onResize = function() {

}