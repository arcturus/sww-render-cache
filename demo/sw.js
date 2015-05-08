importScripts('../bower_components/serviceworkerware/dist/sww.js');
importScripts('../dist/RenderCache.js');

var worker = new ServiceWorkerWare();
worker.use(new RenderCache({
  cacheName: 'renderCache'
}));

// For any request that is not handled perviously just go to the network
worker.use(function(request, response) {
  if (response) {
    return Promise.resolve(response);
  }

  return fetch(request);
});

worker.init();
