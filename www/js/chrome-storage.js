// TODO: Add functionality for storing / retrieving preferences?
(function(ctx) {
	var Storage = function() {
		this.local = new Local();
	};

	var Local = function() {};

	Local.prototype.get = function() {

	};

	$(document).ready(function() {
		ctx.chrome = ctx.chrome || {};
		ctx.chrome.storage = new Storage();
	});
})(window);