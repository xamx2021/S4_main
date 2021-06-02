"use strict";  			 
var superConstructor = require('./inc__common.js');

//------------------- MODULE CONSTRUCTOR: -----------
var _moduleScope = function () 
	{ 	
		var moduleScope  =	superConstructor.Constructor(_moduleScope, arguments);
		return moduleScope.prototype;
	};
  
module.exports = _moduleScope;


//==================================================================================
//==================================================================================
var html = (function () {/*
  
	
			%*dashboard*%

 
 */}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
 
_moduleScope.html_n = html; 