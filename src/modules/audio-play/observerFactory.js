function observerFactory(observer) {
	if(typeof observer !== 'object') return;

	observer._listeners = {};

	observer.$on = function(type, fn) {
		this._listeners[type] = this._listeners[type] || [];

		if (typeof fn === "function") {
			this._listeners[type].push(fn);
		}

		return this;
	},
	observer.$off = function(type, fn) {
		var eventArr = this._listeners[type];

		if (eventArr instanceof Array) {
			if (typeof fn === "function") {
				for (var i = 0, len = eventArr.length; i < len; i++) {
					if (eventArr[i] === fn) {
						eventArr.splice(i, 1);
						break;
					}
				}
			} else if (typeof fn === "undefined") {
				delete this._listeners[type];
			}
		}
	},
	observer.$trigger = function(type) {
		var eventArr = this._listeners[type];

		if (eventArr instanceof Array) {
			for (var i = 0, len = eventArr.length; i < len; i++) {
				if (typeof eventArr[i] === "function") {
					eventArr[i].call(this);
				}
			}
		}

		return this;
	}
}

export default observerFactory;