const urlExists = require('url-exists');
const { promisify } = require('util');
const { stat, readdir } = require('fs');
const { join, resolve } = require('path');
const _ = require("underscore");
const mongoose = require('mongoose');
const userActivityTimelinesRepo = require('../modules/userActivityTimelines/repositories/userActivityTimelines.repository');
const otpGenerate = require('otp-generator')

let Utils = {

	handleNameFields: (body) => {
		if (body.first_name && body.last_name) body.fullName = (body.first_name.trim() + ' ' + body.last_name.trim());
		if (body.fullName) {
			let spaces = body.fullName.trim().split(' ');
			if (spaces.length > 1) {
				body.last_name = spaces[spaces.length - 1].trim();
				body.first_name = body.fullName.replace(body.last_name, '').trim();
			}
		}
		return body;
	},

	deleteUserActivity: async (params) => {
		try {
			await userActivityTimelinesRepo.bulkDelete(params);
			return true;
		} catch (e) {
			console.log(e);
			return false;
		}
	},

	numFormatter: (numbers) => {
		// Thousand(K), Million(M), Billion(B), Trillion(T), Peta(P), Exa(E)
		const num = Number(numbers);
		const si = [
			{ value: 1, symbol: '' }, // if value < 1000, nothing to do
			{ value: 1E3, symbol: 'k' }, // convert to K for number from > 1000 < 1 million 
			{ value: 1E6, symbol: 'm' }, // convert to M for number from > 1 million 
			{ value: 1E9, symbol: 'B' }, // convert to B for number greater than 1 Billion
			{ value: 1E12, symbol: 'T' }, // convert to T for number greater than 1 Trillion
			//   { value: 1E15, symbol: 'P' }, // convert to P for number greater than 1 Peta
			//   { value: 1E18, symbol: 'E' } // convert to E for number greater than 1 Exa
		];
		const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
		let i;
		for (i = si.length - 1; i > 0; i--) {
			if (num >= si[i].value) {
				break;
			}
		}
		return (num / si[i].value).toFixed(2).replace(rx, '$1') + ' ' + si[i].symbol;
	},

	isDirectory: async (f) => {
		return (await promisify(stat)(f)).isDirectory();
	},
	_readdir: async (filePath) => {
		const files = await Promise.all((await promisify(readdir)(filePath)).map(async f => {
			const fullPath = join(filePath, f);
			return (await Utils.isDirectory(fullPath)) ? Utils._readdir(fullPath) : fullPath;
		}))

		return _.flatten(files);
	},

	readDirectory: async (path) => {

		readdir(path, function (err, items) {

		});
	},
	asyncForEach: async (array, callback) => {
		for (let index = 0; index < array.length; index++) {
			await callback(array[index], index, array);
		}
	},
	inArray: (array, ch) => {
		obj = _.find(array, (obj) => (obj == ch.toString()))
		if (obj != undefined) {
			return true;
		} else {
			return false;
		}
	},
	inArrayObject: (rules, findBy) => {
		const _rules = _.findWhere(rules, findBy);
		if (!_rules) {
			return false;
		} else {
			return true;
		}
	},
	objectKeyByValue: (obj, val) => {
		return Object.entries(obj).find(i => i[1] === val);
	},
	humanize: (str) => {
		const frags = str.split('_');
		for (i = 0; i < frags.length; i++) {
			frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
		}
		return frags.join(' ');
	},
	existsSync: (filePath) => {
		const fullpath = upload_directory + filePath;
		try {
			fs.statSync(fullpath);
		} catch (err) {
			if (err.code == 'ENOENT') return false;
		}
		return true;
	},
	toThousands: n => {
		return n.toString().replace(/,/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	},
	formatDollar: num => {
		num = Number(num);
		const p = num.toFixed(2).split(".");
		return "$" + p[0].split("").reverse().reduce((acc, num, i) => {
			return num == "-" ? acc : num + (i && !(i % 3) ? "," : "") + acc;
		}, "") + "." + p[1];
	},
	clone: copyobj => {
		try {
			let tmpobj = JSON.stringify(copyobj);
			return JSON.parse(tmpobj);
		} catch (e) {
			return {};
		}
	},
	valEmail: email => {
		let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(email);
	},
	safeparse: (jsonString, def) => {
		return Utils.safeParseJson(jsonString, def);
	},
	safeParseJson: (jsonString, def) => {
		try {
			let o = JSON.parse(jsonString);
			if (o) {
				return o;
			}
		} catch (e) {
			//winston.error(e.message);
		}
		return def;
	},
	evalJSON: jsonString => {
		try {
			//let o = JSON.parse(jsonString);
			let o = JSON.parse(JSON.stringify(jsonString));
			if (o && typeof o === "object") {
				return o;
			}
		} catch (e) { }
		return false;
	},
	toObjectId: str => {
		if (typeof str === 'string') {
			return /^[a-f\d]{24}$/i.test(str);
		} else if (Array.isArray(str)) {
			return str.every(arrStr => /^[a-f\d]{24}$/i.test(arrStr));
		}
		return false;
	},
	orderNumber: () => {
		let now = Date.now().toString() // '1492341545873'
		// pad with extra random digit
		now += now + Math.floor(Math.random() * 10)
		// format
		return ['ORD', now.slice(0, 14)].join('-')
	},
	betweenRandomNumber: (min, max) => {
		return Math.floor(
			Math.random() * (max - min + 1) + min
		)
	},
	// otp generate
	customOtpGenerate: (num) => {
		return otpGenerate.generate(num, {
			digits: true,
			lowerCaseAlphabets: true,
			upperCaseAlphabets: true,
			specialChars: true,
		});
	},
	// otp only number
	customNumberOtp: (num) => {
		return otpGenerate.generate(num, {
			digits: true,
			lowerCaseAlphabets: false,
			upperCaseAlphabets: false,
			specialChars: false,
		});
	},

	isProductAttribute: (array, ch) => {
		obj = _.filter(array, (obj) => { return obj.attribute_id.toString() == ch.toString() })
		return obj;
	},
	isLinkExist: url => {
		return urlExists(url, (err, exists) => (exists ? true : false));
	},
	ifBlankThenNA(value) {
		return (typeof value === 'string' && value) ? value : 'NA';
	}

};

module.exports = Utils;
