var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Gallery Model
 * =============
 */

var Gallery = new keystone.List('Gallery', {
	sortable: true,
	autokey: { from: 'name', path: 'key', unique: true },
});

Gallery.add({
	name: { type: String, required: true },
	image: { type: Types.CloudinaryImage },
	images: { type: Types.CloudinaryImages },
});

Gallery.defaultColumns = 'name, image';
Gallery.register();
