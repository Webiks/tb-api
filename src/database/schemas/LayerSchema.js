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

const droneCenter = {
	type: {
		$type: String,
		enum: ['Feature']
	},
	geometry: {
		type: {
			$type: String,
			enum: ['Point']
		},
		coordinates: [Number]  // Array of 2 numbers
	},
	properties: {}
};

const geoData = {
	isGeoRegistered: Boolean,
	droneCenter,
	footprint,
	centerPoint: [Number, Number],
	bbox: [Number, Number, Number, Number]				// [ minx, miny, maxx, maxy ]
};

// LAYER: from GeoServer - Layer page
const layer = {
	name: String,
	defaultStyle: {
		name: String,
		href: String                                // href to the style page
	},
	resource: {
		class: String,                              // @class field
		name: String,                               // the worldLayer Id ( worldname: layername )
		href: String                                // href to the details (RASTER/VECTOR) page
	},
	attribution: {
		logoWidth: Number,
		logoHeight: Number
	}
};

// STORE: from GeoServer - Store page (coveragestores(RASTER) / datastores(VECTOR))
const store = {
	storeId: String,                              // get from the details page (RASTER/VECTOR) store's name field
	name: String,
	enabled: Boolean,
	_default: Boolean,
	workspace: {
		name: String,                              	// the name of the world
		href: String                               	// href to the workspace page
	},
	connectionParameters: {                    	  // was translated from a map
		namespace: String,
		url: String                                 // VECTOR only
	},
	url: String,                                  // RASTER only
	href: String                                  // get from the "coverages"  in RASTERS or "featureTypes" in VECTORS
};

// LAYER DETAILS: from GeoServer - RASTER (coverage object) / VECTOR (featureType object) page
const data = {
	name: String,
	nativeName: String,
	namespace: {
		name: String,
		href: String                                 // href to the namespace page
	},
	title: String,
	keywords: {
		string: [String]
	},
	nativeCRS: String,                              // was translated from a map
	srs: String,
	nativeBoundingBox: {
		minx: Number,
		maxx: Number,
		miny: Number,
		maxy: Number,
		crs: String                                 	// was translated from a map
	},
	latLonBoundingBox: {
		minx: Number,
		maxx: Number,
		miny: Number,
		maxy: Number,
		crs: String
	},
	projectionPolicy: String,
	enabled: Boolean,
	metadata: {                                     // was translated from a map
		dirName: String,                           		// RASTERS
		recalculateBounds: String                  		// VECTROS
	},
	store: {
		class: String,                              	// @class field ('coverage' or 'datastore')
		name: String,                               	// the store id ( worldname: storename )
		href: String                                	// href to the store page
	},
	// VECTORS only
	maxFeatures: Number,
	numDecimals: Number,
	overridingServiceSRS: Boolean,
	skipNumberMatched: Boolean,
	circularArcPresent: Boolean,
	attributes: {
		attribute: [
			{
				name: String,
				minOccurs: Number,
				maxOccurs: Number,
				nillable: Boolean,
				binding: String
			}
		]
	},
	// RASTER only
	nativeFormat: String,
	grid: {
		dimension: Number,                          // @dimension field
		range: {
			low: String,
			high: String
		},
		transform: {
			scaleX: Number,
			scaleY: Number,
			shearX: Number,
			shearY: Number,
			transletX: Number,
			transletY: Number
		},
		crs: String
	},
	supportedFormats: {
		string: [String]
	},
	interpolationMethods: {
		string: [String]
	},
	defaultInterpolationMethod: String,
	dimension: {
		coverageDimension: [
			{
				name: String,
				description: String,
				range: {
					min: Number || String,
					max: Number || String
				},
				nullValues: {
					double: [Number]
				},
				unit: String,
				dimensionType: {
					name: String
				}
			}
		]
	},
	requestSRS: {
		string: [String]
	},
	responseSRS: {
		string: [String]
	},
	parameters: {
		entry: [
			{
				string: [String]
			}
		]
	}
};

// FILE DATA: data from the upload file
const fileData = {
	name: String,														// the original name
	size: Number,                           // MB or KB
	fileCreatedDate: Date | String,					// the file created date
	fileUploadDate: Date | String,				  // the upload file date
	fileExtension: { $type: String, lowercase: true },
	format: { $type: String, uppercase: true },
	encodeFileName: String,									// the encoded file name (differ when there is special charecters in the name)
	filePath: String,												// the encoded upload file path
	zipPath: String									 				// the zip path of the upload vector (for removing it later)
};

// INPUT DATA: data from the user
const inputData = {
	name: String,
	flightAltitude: Number,
	cloudCoveragePercentage: Number,
	sensor: {
		name: String,
		type: String ,
		model: String,
		maker: String,
		bands: [String]
	},
	tb: {
		affiliation: { $type: String, uppercase: true, enum: ['INPUT', 'OUTPUT', 'UNKNOWN'] },  // 'INPUT' or 'OUTPUT'
		GSD: Number
	},
	ol: {
		zoom: Number,
		opacity: { $type: Number, min: 0, max: 1 }
	},
	ansyn: {
		description: String,
		creditName: String
	}
};

// IMAGE DATA: metadata of the upload JPG image
const imageData = {
	Make: String,														// sensor maker
	Model: String,													// sensor model
	modifyDate: Date | String,				  		// modified date, format: "YYYY:MM:DD hh:mm:ss"
	dateTimeOriginal: Date | String,				// original date "date/timeOriginal", format: "YYYY:MM:DD hh:mm:ss"
	createDate: Date | String,							// created date, format: "YYYY:MM:DD hh:mm:ss"
	GPSLatitudeRef: String,									// x-point orientation (latitude)
	GPSLatitude: Number,										// x-point (latitude)
	GPSLongitudeRef: String,								// y-point orientation (longitude)
	GPSLongitude: Number,										// y-point (longitude)
	GPSAltitude: Number, 										// absolute altitude
	relativeAltitude: Number,								// relative altitude
	ExifImageWidth: Number,								  // the picture size in pixels
	ExifImageHeight: Number, 						 	  // the picture size in pixels
	pitch: Number,
	yaw: Number,
	roll: Number,
	cameraPitch: Number,
	cameraYaw: Number,
	cameraRoll: Number,
	gimbalRollDegree: Number,
	gimbalYawDegree: Number,
	gimbalPitchDegree: Number,
	flightRollDegree: Number,
	flightYawDegree: Number,
	flightPitchDegree: Number,
	camReverse: Number,
	gimbalReverse: Number,
	fieldOfView: Number
};

/* exif-parser fields:
	ImageDescription: String,							  // "DCIM\\100MEDIA\\DJI_0008.JPG"
	SerialNumber: String,
	InteropIndex: String,
	Software: String,
	Orientation: Number,
	XResolution: Number,										// resolution
	YResolution: Number,										// resolution
	ResolutionUnit: Number,								  // resolution
	YCbCrPosition: Number,
	GPSVersionId: [Number, Number, Number, Number],
	ExposureTime: Number,
	ExposureProgram: Number,
	ExposureCompensation: Number,
	ExposureIndex: String,									// "undef"
	ExposureMode: Number,
	FNumber: Number,
	ISO: Number,
	CompressedBitPerPixel: Number,
	ShutterSpeedValue: Number,
	ApertureValue: Number,
	MaxApertureValue: Number,
	SubjectDistance: Number,
	SubjectDistanceRange: Number,
	MeteringMode: Number,
	LightSource: Number,
	Flash: Number,
	FocalLength: Number,
	FocalLengthIn35mmFormat: Number,
	ColorSpace: Number,
	CustumRendered: Number,
	WhiteBalance: Number,
	DigitalZoomRatio: String,							  // "undef"
	SceneCaptureType: Number,
	GainControl: Number,
	Contrast: Number,
	Saturation: Number,
	Sharpness: Number
*/

/* exif-tool fields:
	exiftoolVersionNumber: Number,
	fileType: String,																// "JPEG"
	fileTypeExtension: String, 											// "jpg"
	mimeType: String,																// "image/jpeg"
	exifByteOrder: String,													// "Little-endian (Intel, II)"
	exifVersion: Number,
	componentsConfiguration: String,								// "-, Cr, Cb, Y"
	warning: String,																// "[minor] Possibly incorrect maker notes offsets (fix by 1783?)"
	speedX: Number,
	speedY: Number,
	speedZ: Number,
	flashpixVersion: Number,
	interoperabilityIndex: String,	 								// "R98 - DCF basic file (sRGB)",
	interoperabilityVersion: Number,
	fileSource: String,															// "Digital Camera"
	sceneType: String,															// "Directly photographed"
	gpsVersionID: String,														// "2.3.0.0"
	gpsAltitudeRef: String, 												// "Above Sea Level"
	xpComment: String, 															// "Type=N, Mode=P, DE=None"
	xpKeywords: String, 														// "v01.05.1577;1.1.6;v1.0.0"
	compression: String, 														// "JPEG (old-style)"
	thumbnailOffset: Number,
	thumbnailLength: Number,
	about: String, 																	// "DJI Meta Data"
	format: String, 																// "image/jpg"
	absoluteAltitude: Number,
	selfData: String,
	version: Number,
	hasSettings: String, 														// "False" (need to convert to boolean)
	hasCrop: String, 																// "False" (need to convert to boolean)
	alreadyApplied: String, 												// "False" (need to convert to boolean)
	mpfVersion: Number,
	numberOfImages: Number,
	mpImageFlags: String, 													// "Dependent child image"
	mpImageFormat: String, 													// "JPEG"
	mpImageType: String, 														// "Large Thumbnail (VGA equivalent)"
	mpImageLength: Number,
	mpImageStart: Number,
	dependentImage1EntryNumber: Number,
	dependentImage2EntryNumber: Number,
	imageUIDList: String, 													// "(Binary data 66 bytes, use -b option to extract)"
	totalFrames: Number,
	encodingProcess: String, 												// "Baseline DCT, Huffman coding"
	bitsPerSample: Number,
	colorComponents: Number,
	yCbCrSubSampling: String, 											// "YCbCr4:2:2 (2 1)",
	gpsPosition: String, 														// "32 deg 4' 35.64\" N, 34 deg 47' 42.20\" E" (lan, long)
	imageSize: String, 															// "5472x3078" ("width X height")
	previewImage: String, 													// "(Binary data 251980 bytes, use -b option to extract)"
	megapixels: Number,
	scaleFactorTo35MmEquivalent: Number,
	shutterSpeed: String, 													// "1/500"
	thumbnailImage: String, 												// "(Binary data 10685 bytes, use -b option to extract)"
	circleOfConfusion: String, 											// "0.011 mm"	(need to convert to float-number)
	hyperfocalDistance: String, 										// "1.12 m" (need to convert to float-number)
	lightValue: Number
*/

// field for GeoServer layer
const geoserver = {
	layer,
	store,
	data
};

// create the World-Layer Schema
const LayerSchema = new Schema({
	_id: String ,         				  	 						 // get the id from uuid function
	name: String,                                  // image = the encoded name, GeoServer = the layer name
	fileType: { $type: String, lowercase: true, enum: ['raster', 'vector', 'image'] },
	createdDate: Number,													 // the file created date as a number
	displayUrl: String,														 // S3's url to display the layer: JPG = the image Url, Geotiff = the wmts request Url
	thumbnailUrl: String,
	fileData,
	imageData,
	geoData,
	inputData,
	geoserver
}, { typeKey: '$type' }, { _id : false });

// create the layer MODEL
const layerModel = mongoose.model('Layer', LayerSchema);

module.exports = layerModel;
