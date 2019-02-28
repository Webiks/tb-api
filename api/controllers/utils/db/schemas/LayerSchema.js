const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const footprint = {
	type: {
		$type: String,
		enum: ['Feature']
	},
	properties: {},
	geometry: {
		type: {
			$type: String,
			enum: ['Polygon']
		},
		coordinates: [[[Number]]], // Array of arrays of arrays of 2 numbers
	}
};

// field for GeoServer layer
const geoserver = {
	id: Number,
	task: Number
};
const tag = {
	fileType: String,
	bbox: {
		minx: Number,
		miny: Number,
		maxx: Number,
		maxy: Number,
		crs: String
	},
	projection: String,
	geoserver: {
		layer: {
			resource: {
				name: String
			}
		}
	},
	imageData: {
		ExifImageWidth: Number,
		ExifImageHeight: Number
	}
};
const camera = {make: String, model: String};
// create the World-Layer Schema
const LayerSchema = new Schema({
	_id: String,         				  	 						 // get the id from uuid function
	name: String,                                  // image = the encoded name, GeoServer = the layer name
	date: String,													 // the file created date as a number
	photoTime: String,
	imageUrl: String,														 // S3's url to display the layer: JPG = the image Url, Geotiff = the wmts request Url
	thumbnailUrl: String,
	isGeoRegistered: Boolean,
	sensorName: String,
	sensorType: String,
	camera,
	footprint,
	tag,
	geoserver
}, { _id: false });

// create the layer MODEL
const layerModel = mongoose.model('Layer', LayerSchema);

module.exports = layerModel;
