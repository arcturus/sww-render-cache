importScripts('../bower_components/serviceworkerware/dist/sww.js');
importScripts('../dist/RenderCache.js');

var worker = new ServiceWorkerWare();
worker.use(new RenderCache({
  cacheName: 'renderCache'
}));

worker.init();
