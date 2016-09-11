var keystone = require('keystone');
var Promise = require('bluebird');
var _ = require('lodash');
var staticData = require('../staticData');

// keystone saves html tags in strings
const tagRemove = /<\/?[^>]+(>|$)/g;
const breakDetect = /<br>|&nbsp;/g;

function landingTextParse (textWithTags) {
	return textWithTags.split(breakDetect).map(str => str.replace(tagRemove, ''));
}

const propsTransform = {
	'Upcoming': (locals, obj) => {
		_.set(locals, ['landing', 'init', 'image'], obj.image.url);
		_.set(locals, ['landing', 'tab1', 'content'], landingTextParse(obj.content.extended));
	},
	'About Julia': (locals, obj) => {
		_.set(locals, ['landing', 'tab2', 'image'], obj.image.url);
		_.set(locals, ['landing', 'tab2', 'content'], landingTextParse(obj.content.extended));
	},
	'Resume': (locals, obj) =>
		_.set(locals, ['siteHeader', 'resumeLink'], obj.image.url),
	'Videos': (locals, obj) => {
		// @TODO make video model more robust somehow
	},
	'Quotes': (locals, obj, number) => {
		if (!locals.quotes) locals.quotes = [];
		const quoteObj = {
			image: obj.image.url,
			content: obj.content.brief.replace(tagRemove, '').replace(breakDetect, ''),
			author: obj.content.extended.replace(tagRemove, '').replace(breakDetect, ''),
		};
		// nest array
		if (!(locals.quotes.length % 2)) {
			return locals.quotes.push([quoteObj]);
		} else {
			locals.quotes[locals.quotes.length - 1].push(quoteObj);
		}
	},
	'Contact Image': (locals, obj) =>
		_.set(locals, ['contact', 'mainImg'], obj.heroImage.url),
	'Photo Section': (locals, obj) =>
		_.set(locals, 'photos', obj.images.map(imageObj => ({
			src: imageObj.url,
			orientation: imageObj.height > imageObj.width ? 'vertical' : 'horizontal',
			width: imageObj.width,
			description: '',
		}))),
};

exports = module.exports = function (req, res) {

	var view = new keystone.View(req, res);
	var locals = res.locals;

	// locals.section is used to set the currently selected
	// item in the header navigation.
	locals.section = 'home';

	// Set static data locals
	_.merge(locals, staticData);

	// define mongoose query promise
	const queryPromiseObj = [ // { lean: true }
		keystone.list('Post').model.find({}, {
			'_id': 0,
			'title': 1,
			'content': 1,
			'image.url': 1,
			'categories': 1,
		}, { lean: true }).where('state', 'published').populate('categories', { _id: 0, name: 1 }).exec(),
		keystone.list('Gallery').model.find({}, {
			'_id': 0,
			'heroImage.url': 1,
			'name': 1,
			'images.url': 1,
			'images.height': 1,
			'images.width': 1,
		}, { lean: true }).sort('sortOrder').exec(),
	];

	// Load other posts
	view.on('init', function (next) {
		Promise.all(queryPromiseObj).then(dbData => {
			// sort by category an pull category off nesting
			dbData[0].sort((a, b) => {
				if (!a.category) {
					a.category = _.get(a, ['categories', 0, 'name']);
					delete a.categories;
				}
				if (!b.category) {
					b.category = _.get(b, ['categories', 0, 'name']);
					delete b.categories;
				}
				a.category < b.category;
			});

			// apply transforms to locals object
			_.flatten(dbData).forEach(val => {
				propsTransform[val.name]
				? propsTransform[val.name](locals, val)
				: propsTransform[val.title]
				? propsTransform[val.title](locals, val)
				: propsTransform[val.category]
				? propsTransform[val.category](locals, val) : null; // console.log(val);
			});
			next();
		}).catch(err => next(err));
	});

	// Render the view
	view.render('index');
};
