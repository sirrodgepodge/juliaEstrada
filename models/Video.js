var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Video Model
 * =============
 */

var Video = new keystone.List('Video', {
	sortable: true,
	autokey: { from: 'name', path: 'key', unique: true },
});

Video.add({
  'name': { type: String, required: true },
  'subTitle': { type: Types.Html, wysiwyg: true, height: 40 },
  'image': { type: Types.CloudinaryImage },
  'youtubeId': { type: String },
  'Seconds To Cut From Beginning': { type: Number },
  'Seconds To Cut From End': { type: Number },
});

Video.defaultColumns = 'name, image';
Video.register();
