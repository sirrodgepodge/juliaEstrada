var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Photo Model
 * =============
 */

var Photo = new keystone.List('Photo', {
	sortable: true,
	autokey: { from: 'name', path: 'key', unique: true },
});

Photo.add({
	name: { type: String, required: true },
	image: { type: Types.CloudinaryImage },
	description: { type: String },
});

Photo.defaultColumns = 'name, image';
Photo.register();
