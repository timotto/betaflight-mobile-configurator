(function(ctx) {
	var Runtime = function() {
		this.manifest = {};

		var self = this;

		$.getJSON('./betaflight-configurator/manifest.json', function (data) {
			self.manifest = data;
		});
	};

	Runtime.prototype.getManifest = function() {
		return this.manifest;
	};

	ctx.chrome = ctx.chrome || {};
	ctx.chrome.runtime = new Runtime();
})(window);

