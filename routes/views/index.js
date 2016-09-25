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
		_.set(locals, ['siteHeader', 'mobileAbout'], landingTextParse(obj.content.brief));
		_.set(locals, ['landing', 'tab2', 'content'], landingTextParse(obj.content.extended));
	},
	'Resume': (locals, obj) =>
		_.set(locals, ['siteHeader', 'resumeLink'], obj.image.url),
	'Videos': (locals, obj) => {
		// init array
		if (!locals.videos) locals.videos = [];

		// create video object
		const videoObj = {
			title: obj.title,
			image: obj.image.url,
			subText: [],
			videoData: {},
		};
		obj.content.brief.split('<em>').forEach((segment, index, array) => {
			const strippedSegment = segment.replace(tagRemove, '');
			if (!strippedSegment) return; // don't push an empty string
			if (array.length === 1) { // handle case of no italics
				return videoObj.subText.push({
					fontStyle: 'normal',
					text: strippedSegment,
				});
			}
			const splitSegment = segment.split('</em>');
			const italicSegment = splitSegment[0].replace(tagRemove, '');
			const normalSegment = splitSegment[1].replace(tagRemove, '');
			if (italicSegment) {
				videoObj.subText.push({
					fontStyle: 'italic',
					text: splitSegment[0].replace(tagRemove, ''),
				});
			}
			if (normalSegment) {
				videoObj.subText.push({
					fontStyle: 'normal',
					text: splitSegment[1].replace(tagRemove, ''),
				});
			}
		});
		obj.content.extended.split('\n').forEach(pair => {
			const splitPair = pair.replace(tagRemove, '').replace('\r', '').split('===');
			videoObj.videoData[splitPair[0]] = splitPair[1];
		});

		// add video data to array
		locals.videos.push(videoObj);
	},
	'Quotes': (locals, obj, number) => {
		if (!locals.quotes) locals.quotes = [];
		const quoteObj = {
			image: obj.image.url,
			content: landingTextParse(obj.content.brief),
			author: landingTextParse(obj.content.extended),
		};
		// nest array
		if (!(locals.quotes.length % 2)) {
			return locals.quotes.push([quoteObj]);
		} else {
			locals.quotes[locals.quotes.length - 1].push(quoteObj);
		}
	},
	'Contact Image': (locals, obj) =>
		_.set(locals, ['contact', 'mainImg'], obj.image.url),
	'Photos': (locals, obj) =>
		_.set(locals, 'photos', obj.images.map(imageObj => ({
			src: imageObj.image.url,
			orientation: imageObj.image.height > imageObj.image.width ? 'vertical' : 'horizontal',
			width: imageObj.image.width,
			description: imageObj.description,
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
		keystone.list('Photo').model.find({}, {
			'_id': 0,
			'name': 1,
			'image.url': 1,
			'image.height': 1,
			'image.width': 1,
			'description': 1,
		}, { lean: true }).sort('sortOrder').exec(),
	];

	// Load other posts
	view.on('init', function (next) {
		Promise.all(queryPromiseObj).then(dbData => {
			// sort by category and pull category prop off nesting
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
			dbData[0].concat({
				name: 'Photos',
				images: dbData[1],
			}).forEach(val => {
				propsTransform[val.name]
				? propsTransform[val.name](locals, val)
				: propsTransform[val.title]
				? propsTransform[val.title](locals, val)
				: propsTransform[val.category]
				? propsTransform[val.category](locals, val) : null;
			});
			next();
		}).catch(err => next(err));
	});

	// Render the view
	view.render('index');
};
