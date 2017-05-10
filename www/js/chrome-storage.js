(function(ctx) {
	var Storage = function() {
		this.local = new Local();
	};

	var Local = function() {
		this.isValid = typeof(Storage) !== "undefined";
	};

	Local.prototype.get = function(arg1,  callback) {
		if (!this.isValid || !callback) return;

		var result = {};
		var propNames = [];

		if (arg1 instanceof String || typeof arg1 === 'string') {
			propNames.push(arg1);
		} else if (arg1 instanceof Array) {
			propNames = arg1;
		}

		propNames.forEach(function(propName) {
			var val = sessionStorage.getItem(propName);

			if (val !== undefined && val !== null) {
				try {
					result[propName] = JSON.parse(val);
				} catch (e) {
					result[propName] = val;
				}
			}
		});

		callback(result);
	};

	Local.prototype.set = function(obj, callback) {
		if (!this.isValid || !obj) return;

		var propNames = Object.getOwnPropertyNames(obj);

		propNames.forEach(function(propName) {
			var val;

			try {
				val = JSON.stringify(obj[propName]);
			} catch (e) {
				val = obj[propName];
			}

			sessionStorage.setItem(propName, val);
		});

		if (callback)
			callback();
	};

	$(document).ready(function() {
		ctx.chrome = ctx.chrome || {};
		ctx.chrome.storage = new Storage();
	});
})(window);