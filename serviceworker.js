var appVersion = "1.4.1";

var appScope = self.location.origin + self.location.pathname.substring(0, self.location.pathname.lastIndexOf("/") + 1);

var appFiles = [
    "",
    "index.html",
    "favicon.ico",
    "styles/fonts.css",
    "styles/style.css",
    "fonts/Roboto-Thin.ttf",
    "fonts/Roboto-Light.ttf",
    "scripts/appframework.js",
    "scripts/scoreboard.js",
    "resources/strings/strings.json",
    "resources/it-IT/strings/strings.json",
    "images/send.svg",
    "videos/lucky_animation.webm"
];

var appUrls = appFiles.map(file => appScope + file);

self.addEventListener("install", (event) => {
    event.waitUntil((async () => {
        await caches.delete("billiardsscoreboard.new_version");
        var newCache = await caches.open("billiardsscoreboard.new_version");
        var additionPromises = [];
        for(var file of appUrls) {
            additionPromises.push(newCache.add(new Request(file, {cache: "reload"})));
        }
        await Promise.all(additionPromises);
    })());
});

self.addEventListener("activate", (event) => {
    event.waitUntil((async () => {
        await caches.delete("billiardsscoreboard.current_version");
        var versionCaches = await Promise.all([caches.open("billiardsscoreboard.current_version"), caches.open("billiardsscoreboard.new_version")]);
        var currentCache = versionCaches[0];
        var newCache = versionCaches[1];
        var cloningPromises = [];
        for(var request of await newCache.keys()) {
            cloningPromises.push((async () => await currentCache.put(request, await newCache.match(request)))());
        }
        await Promise.all(cloningPromises);
        await caches.delete("billiardsscoreboard.new_version");
    })());
});

self.addEventListener("fetch", (event) => {
    event.respondWith((async () => {
        if(appUrls.indexOf(event.request.url) != -1) {
            return await (await caches.open("billiardsscoreboard.current_version")).match(event.request.url);
        }
        else {
            return await fetch(event.request);
        }
    })());
});