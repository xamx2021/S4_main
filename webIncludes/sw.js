
// Service worker



// use a cacheName for cache versioning
var cacheName = 'v1:static';

// during the install phase you usually want to cache static assets
self.addEventListener('install', function(e) {
    // once the SW is installed, go ahead and fetch the resources to make this work offline
    e.waitUntil(
        caches.open(cacheName).then(function(cache) {
            return cache.addAll([

		 
		//           './',
    	   
		//		"/manifest.json",
				
				"/webIndex.html",
				"/webLogin.html",
				
				"/ui_ddd_page_css.js",
				"/images/Loader.gif ",
				"/images/testLogo.png",
				"/favicon.ico",
				"/themes/custom1/images/plug-in-icon.png",
				
				"/micro_FWBH.js",
				"/lib/canvasjs/cracked.canvasjs.min.js",
				"/lib/jquery.min.js",
				"/lib/jquery-ui.min.js",
				"/lib/rws.js",
				"/lib/bootstrap.min.js",
				"/lib/bootstrap-dialog.min.js",
				"/lib/crypto-js/aes.js",
				"/themes/dark-hive-mod/jquery-ui.min.css",
			 
				"/themes/dark-hive-mod/theme.css",
				"/themes/dark-hive-mod/bootstrap-dialog.min.css",
		//		"/themes/dark-hive-mod/dataTables.css",
		//		"/themes/dark-hive-mod/buttons.dataTables.min.css",
		//		"/themes/dark-hive-mod/select.dataTables.min.css",	
				//	"/themes/dark-hive-mod/hint.css",	
				"/themes/dark-hive-mod/mod.css",				
				"/themes/custom1/jquery-ui.min.css",
				"/themes/custom1/bootstrap-dialog.min.css",	
				//	"/themes/custom1/dataTables.css",						
			//	"/themes/custom1/buttons.dataTables.min.css",
				//	"/themes/custom1/hint.css",
				"/themes/custom1/theme.css",
			//	"/themes/custom1/select.dataTables.min.css",				
				//"/themes/Custom/jquery-ui.min.css",
				//"/themes/Custom/bootstrap-dialog.min.css",
				//	"/themes/Custom/dataTables.css",
				//"/themes/Custom/buttons.dataTables.min.css",
				//	"/themes/Custom/hint.css");	
				//"/themes/Custom/theme.css",
				//"/themes/Custom/select.dataTables.min.css",	
		 	 
		 
		 
            ]).then(function() {
                self.skipWaiting();
            });
        })
    );
});

// when the browser fetches a url
self.addEventListener('fetch', function(event) {
    // either respond with the cached object or go ahead and fetch the actual url
    event.respondWith(
        caches.match(event.request).then(function(response) {
            if (response) {
                // retrieve from cache
                return response;
            }
            // fetch as normal
            return fetch(event.request);
        })
    );
});