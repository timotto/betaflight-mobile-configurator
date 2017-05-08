(function(ctx) {
	var I18n = function() {
		this.languages = ['en'];
		this.language = 'en';
		this.locales = {};

		var self = this;

		this.languages.forEach(function(language) {
			$.getJSON('./betaflight-configurator/_locales/' + language + '/messages.json', function (data) {
				self.locales[language] = data;
			});
		});
	};

	I18n.prototype.getMessage = function(id, params) {
		var phrase = this.locales[this.language][id];
		var message = phrase ? phrase.message : id;

		return message.replace(/\$\d/g, function(attr) {
			var num = Number(attr[1]) - 1;
			return params[num] || '';
		});
	};

	ctx.chrome = ctx.chrome || {};
	ctx.chrome.i18n = new I18n();
})(window);