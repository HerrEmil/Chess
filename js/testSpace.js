var testSpace = {
	counter : 0,
	increment : function () {
		'use strict';
		this.counter += 1;
	},
	log : function () {
		'use strict';
		console.log(this.counter);
	}
};