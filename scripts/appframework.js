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
    loadPromises.push(new RequestPromise("resources/strings/strings.json", (request) => {
        this.strings = new Map(JSON.parse(request.responseText));
    }));

    var layeredStrings = null;
    if(locale != null)
    {
        loadPromises.push(new RequestPromise("resources/" + locale + "/strings/strings.json", (request) => {
            layeredStrings = JSON.parse(request.responseText);
        }));
    }

    RequestPromise.waitAll(loadPromises, () => {
        if(layeredStrings != null)
            this.updateMap(this.strings, layeredStrings);
        
        if(onLoaded != null)
            onLoaded();
    });
}

ResourceManager.prototype.updateMap = function(map, entries) {
    entries.forEach(entry => map.set(entry[0], entry[1]));
}

ResourceManager.prototype.getFormattedString = function(id) {
    var formatArguments = arguments;
    return this.strings.get(id).replace(/{(\d+)}|\\([{\\])/g, (match, p1, p2) => {
        if(p1 != undefined) {
            return formatArguments[parseInt(p1) + 1];
        }
        else {
            return p2;
        }
    });
}

function App() {
    this.onstart = null;
    this.supportedLocales = [];
    this.localeAliases = new Map();
    this.resourceManager = new ResourceManager();
    this.initializableProperties = new Map([
        ["#text", ["textContent"]],
        ["IMG", ["alt"]],
        ["INPUT", ["value", "title"]]
    ]);
}

App.prototype.loadScreen = function(screen) {
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

App.prototype.requestScreenAnimationFrame = function(callback) {
    var callingScreen = this.currentScreen;
    window.requestAnimationFrame((t) => {
        if(callingScreen == this.currentScreen)
            callback(t);
    });
}

App.prototype.initializeElement = function(element) {
    var elementInitializableProperties = this.initializableProperties.get(element.nodeName);
    if(elementInitializableProperties != null)
    {
        elementInitializableProperties.forEach(property => {
            if(element[property].startsWith("@res:"))
            {
                element[property] = this.resourceManager.strings.get(element[property].substring(5));
            }
        });
    }
    element.childNodes.forEach(child => this.initializeElement(child));
}

App.prototype.onResize = function(event) {
    if(this.currentScreen != null)
    {
        this.currentScreen.onResize();
    }
}

App.prototype.onMouseDown = function(event) {
    if(!document.body.classList.contains("using_mouse"))
        document.body.classList.add("using_mouse");
}

App.prototype.onKeyDown = function(event) {
    if(event.key == "Tab") {
        if(document.body.classList.contains("using_mouse"))
            document.body.classList.remove("using_mouse");
    }
}

var app = new App();

window.addEventListener("load", function() {
    if("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./serviceworker.js", {scope: "./"}).catch(err => console.log(err));
    }

    var detectedLocale = null;
    if("languages" in navigator) {
        for(var i = 0; i < navigator.languages.length; i++) {
            if(app.supportedLocales.indexOf(navigator.languages[i]) != -1) {
                detectedLocale = navigator.languages[i];
                break;
            }
            else {
                var mappedLocale = localeAliases.get(navigator.languages[i]);
                if(mappedLocale != undefined) {
                    detectedLocaleLocale = mappedLocale;
                    break;
                }
            }
        }
    }
    if(detectedLocale == null) {
        if("language" in navigator) {
            if(app.supportedLocales.indexOf(navigator.language) != -1) {
                detectedLocale = navigator.language;
            }
            else {
                var mappedLocale = localeAliases.get(navigator.language);
                if(mappedLocale != undefined) {
                    detectedLocaleLocale = mappedLocale;
                }
            }
        }
    }

    app.resourceManager.loadResources(detectedLocale, () => { if(app.onstart != null) app.onstart(); })
});

window.addEventListener("resize", (e) => app.onResize(e));

window.addEventListener("mousedown", app.onMouseDown);
window.addEventListener("keydown", app.onKeyDown);

function AppScreen() {
    this.contentId = null;
}

AppScreen.prototype.onStart = function() {

}

AppScreen.prototype.onResize = function() {

}