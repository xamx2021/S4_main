
	function loadCSS( css_path )
				{
						var head = document.getElementsByTagName('head')[0];
						var link = document.createElement('link');
						//link.id   = cssId;
						link.rel  = 'stylesheet';
						link.type = 'text/css';
						link.href = css_path;
						link.media = 'all';
						head.appendChild(link);				
				}
				
				
				const user_language =  'S4_language_user';
				const user_language_n =  'S4_language_user_n';
				
				const user_theme =  'S4_theme_user';
				const user_theme_n =  'S4_theme_user_n';
				
				
			
			var userLanguage = localStorage.getItem(user_language);
			var userLanguage_sn = localStorage.getItem(user_language_n);
			
			var userTheme = localStorage.getItem(user_theme);
			var userTheme_sn = localStorage.getItem(user_theme_n);
			
			var set = 
				{
					"black":  function()
						{ 							
							loadCSS("/themes/dark-hive-mod/jquery-ui.min.css");		
							loadCSS("/themes/dark-hive-mod/theme.css");	
							loadCSS("/themes/dark-hive-mod/bootstrap-dialog.min.css");	
				//			loadCSS("/themes/dark-hive-mod/dataTables.css");
				//			loadCSS("/themes/dark-hive-mod/buttons.dataTables.min.css");		
				//			loadCSS("/themes/dark-hive-mod/select.dataTables.min.css");		
						//	loadCSS("/themes/dark-hive-mod/hint.css");		
							loadCSS("/themes/dark-hive-mod/mod.css");								
							$('body').removeClass('app-white');
						},
					"white_1":  function()
						{ 
							loadCSS("/themes/custom1/jquery-ui.min.css");	
							loadCSS("/themes/custom1/bootstrap-dialog.min.css");								
					//		loadCSS("/themes/custom1/dataTables.css");							
					//		loadCSS("/themes/custom1/buttons.dataTables.min.css");	
					//		loadCSS("/themes/custom1/hint.css");	
							loadCSS("/themes/custom1/theme.css");
					//		loadCSS("/themes/custom1/select.dataTables.min.css");
							$('body').addClass('app-white');	
						},					
					"white":  function()
						{ 
							loadCSS("/themes/Custom/jquery-ui.min.css");	
							loadCSS("/themes/Custom/bootstrap-dialog.min.css");								
					//		loadCSS("/themes/Custom/dataTables.css");							
					//		loadCSS("/themes/Custom/buttons.dataTables.min.css");	
					//		loadCSS("/themes/Custom/hint.css");	
							loadCSS("/themes/Custom/theme.css");
					//		loadCSS("/themes/Custom/select.dataTables.min.css");
							$('body').addClass('app-white');	
						},
				}
						
						
			function lang_save_and_apply( that )
			{
				var p = that[that.selectedIndex].value;
				var n = that.selectedIndex;
				
				localStorage.setItem(user_language, p);
				localStorage.setItem(user_language_n, n);
			}		
	
		//	if(userLanguage) set[userLanguage]();
		//	else { userTheme_sn = 0; set.black(); }				// default			
	
	
	
			function css_from_path_and_save_new( that )
			{
				var p = that[that.selectedIndex].value;
				var n = that.selectedIndex;
				set[p]();//css_from_path( p );
				localStorage.setItem(user_theme, p);
				localStorage.setItem(user_theme_n, n);
			}		
	
		if(userTheme) set[userTheme]();
		else { userTheme_sn = 0; set.white_1();      }				// default
		//else { userTheme_sn = 0; set.black(); }				// default
	
	


//listHTMLunusedClasses

		function unused(e) {
			const s0 = JSON.stringify(window.getComputedStyle(e));
			const c = Array.from(e.classList.values());
			if (c.length !== 0) {
			  c.forEach(cc => {
				e.classList.remove(cc);
				const s = JSON.stringify(window.getComputedStyle(e));
				if (s0 === s) {
				  console.log(`class ${cc} is unused`);
				}
				e.classList.add(cc);
			  });
			}
			const id = e.id;
			if (id) {
			  e.removeAttribute("id");
			  const s = JSON.stringify(window.getComputedStyle(e));
			  if (s0 === s) {
				console.log(`id ${id} is unused`);
			  }
			  e.id = id;
			}
		  }
		function unused1(e) {
			var classesEvery = [];
			var elementsEvery = document.querySelectorAll('*');
			for (var i = 0; i < elementsEvery.length; i++) 
				{
			  		var classes = elementsEvery[i].className.toString().split(/\s+/);
					  for (var j = 0; j < classes.length; j++) 
					  	{
							var thisClass = classes[j];
							if (thisClass && classesEvery.indexOf(thisClass) === -1)
				  			classesEvery.push(thisClass);
			  			}
				}
		}