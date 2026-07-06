/* Cambrils Tatili — service worker : appli utilisable hors ligne (autoroute, villa sans wifi) */
var CACHE='cambrils-v1';
var CORE=['./','./index.html','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];

self.addEventListener('install',function(e){
 e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(CORE);}));
 self.skipWaiting();
});

self.addEventListener('activate',function(e){
 e.waitUntil(caches.keys().then(function(keys){
  return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
 }));
 self.clients.claim();
});

self.addEventListener('fetch',function(e){
 if(e.request.method!=='GET')return;
 var url=new URL(e.request.url);
 /* Pages (navigation) : réseau d'abord pour avoir les mises à jour, cache si hors ligne */
 if(e.request.mode==='navigate'){
  e.respondWith(
   fetch(e.request).then(function(r){
    var copy=r.clone();
    caches.open(CACHE).then(function(c){c.put('./index.html',copy);});
    return r;
   }).catch(function(){return caches.match('./index.html');})
  );
  return;
 }
 /* Ressources (icônes, Leaflet, tuiles carte) : cache d'abord, sinon réseau puis mise en cache */
 e.respondWith(
  caches.match(e.request).then(function(hit){
   if(hit)return hit;
   return fetch(e.request).then(function(r){
    if(r.ok&&(url.origin===self.location.origin||/cdnjs\.cloudflare\.com/.test(url.host))){
     var copy=r.clone();
     caches.open(CACHE).then(function(c){c.put(e.request,copy);});
    }
    return r;
   });
  })
 );
});
