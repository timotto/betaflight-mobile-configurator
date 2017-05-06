(function(ctx) {
	var Usb = function() {};

	Usb.prototype.getDevices = function() {};

	ctx.chrome = ctx.chrome || {};
	ctx.chrome.usb = new Usb();
})(window);