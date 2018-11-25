import Cesium from 'cesium/Cesium';
import 'cesium/Widgets/widgets.css';
import { featureCollection, point, polygon } from '@turf/turf';

const example = {
	'displayUrl': 'http://tb-server.webiks.com:10010/static/images/d7c6055f-8d7e-1870-5f8d-fbffc59f4ff2/DJI_0025.JPG',
	'GPSLongitude': 35.006097777777775,
	'GPSLatitude': 32.479078,
	'relativeAltitude': 42.4,
	'gimbalRollDegree': 0,
	'gimbalYawDegree': -88.1,
	'gimbalPitchDegree': -90,
	'fieldOfView': 73.7,
	'ExifImageWidth': 4864,
	'ExifImageHeight': 3648
};

export const selector = 'drone-cesium';

export class DroneCesiumComponent extends HTMLElement {

	fetchViewDataRequest(droneInputObject) {
		return this.setViewViaFile(droneInputObject).then(() => {
			return this.getPosition();
		});
	}

	connectedCallback() {
		this.innerHTML = `
			<style>
			.cesium-viewer-bottom{
				display: none !important;
			}
			:host {
					position: relative;
					width: 100vw;
					height: 100vh;
					flex-direction: column;
				}
				h1 {
					margin: 0
				}
				.map-and-image {
					padding: 0 20px;
					flex: 1;
					display: flex;
				}
				.map, .img {
					flex: 1;
				}
				.img {
					display: flex;
					flex-direction: column;
				}
				.img img {
					max-width: 100%;
				}
			</style>

			<div>
				<input type="file" accept="application/json"/>
				<button id="example">Example</button>
			</div>

			<div class="map-and-image">
				<div class="map" id="cesiumContainer"></div>
				<div class="img">
					<img/>
				</div>
			</div>
		`;

		this.imgElement = this.querySelector('img');
		this.exampleButton = this.querySelector('button#example');
		this.fileInput = this.querySelector('input[type="file"]');

		this.viewer = new Cesium.Viewer(this.querySelector('#cesiumContainer'), {
			terrainProvider: Cesium.createWorldTerrain()
		});

		this.exampleButton.addEventListener('click', () => {
			this.setViewViaFile(example);
			this.imgElement.src = example.displayUrl;
		});

		this.fileReader = new FileReader();

		this.fileInput.addEventListener('change', () => {
			if (this.fileInput.files && this.fileInput.files.length) {
				const file = this.fileInput.files.item(0);
				this.fileReader.readAsText(file);
				this.setViewViaFile(file);
			}
		});

		this.fileReader.addEventListener('load', () => {
			const jsonResult = JSON.parse(this.fileReader.result);
			this.setViewViaFile(jsonResult);
		});

	}

	constructor() {
		super();
	}

	setViewViaFile({
									 GPSLongitude: lon,
									 GPSLatitude: lat,
									 relativeAltitude: rel_alt,
									 gimbalRollDegree: roll,
									 gimbalYawDegree: heading,
									 gimbalPitchDegree: pitch,
									 fieldOfView: fov,
									 ExifImageWidth: width,
									 ExifImageHeight: height
								 }) {
		const terrainProvider = Cesium.createWorldTerrain();
		const positions = [Cesium.Cartographic.fromDegrees(lon, lat)];
		return Cesium.sampleTerrainMostDetailed(terrainProvider, positions).then(() => {
			const [{ height: aboveSeaHeight }] = positions;
			const destination = Cesium.Cartesian3.fromDegrees(lon, lat, aboveSeaHeight + rel_alt);

			const orientation = {
				heading: Cesium.Math.toRadians(heading),
				pitch: Cesium.Math.toRadians(pitch),
				roll: Cesium.Math.toRadians(roll)
			};

			this.viewer.camera.setView({ destination, orientation });
			this.viewer.camera.frustum.fov = Cesium.Math.toRadians(fov);
			this.viewer.camera.frustum.aspectRatio = width / height;
		});

	}

	getPosition() {
		const { canvas } = this.viewer;
		const topLeft = this.viewer.camera.getPickRay({ x: 0, y: 0 });
		const topRight = this.viewer.camera.getPickRay({ x: canvas.width, y: 0 });
		const bottomRight = this.viewer.camera.getPickRay({ x: canvas.width, y: canvas.height });
		const bottomLeft = this.viewer.camera.getPickRay({ x: 0, y: canvas.height });
		const center = this.viewer.camera.getPickRay({ x: canvas.width / 2, y: canvas.height / 2 });

		const bboxCoordinates = [topLeft, topRight, bottomRight, bottomLeft, topLeft].map(this.toCartographicDegress.bind(this));
		const centerCoordinates = this.toCartographicDegress(center);
		const bboxPolygon = polygon([bboxCoordinates]);
		const centerPoint = point(centerCoordinates);
		return featureCollection([bboxPolygon, centerPoint]);
	}

	toCartographicDegress(position) {
		const cartesian = this.viewer.scene.globe.pick(position, this.viewer.scene);
		const cartographic = Cesium.Cartographic.fromCartesian(cartesian);

		const longitude = Cesium.Math.toDegrees(cartographic.longitude);
		const latitude = Cesium.Math.toDegrees(cartographic.latitude);
		return [longitude, latitude];
	}

	// viewer;
	// fileReader = new FileReader();
	// selected;

	// inputs= inputs.default;
	// list = Object.values(this.inputs);
	//
	// onFileLoad$: Observable<any> = fromEvent(this.fileReader, 'load').pipe(
	// 	tap(() => {
	// 		const jsonResult = JSON.parse(<string>this.fileReader.result);
	// 		this.setViewViaFile(jsonResult);
	// 	})
	// );

	//
	// onSelectChange(value) {
	// 	const droneInput = this.inputs[value];
	// 	this.setViewViaFile(droneInput);
	// }
	//
	// onFile(files) {
	// 	if (files.length) {
	// 		this.fileReader.readAsText(files.item(0));
	// 	}
	// }
	//
	// exportPosition() {
	// 	const layer = this.getPosition();
	// 	const blob = new Blob([ JSON.stringify(layer) ], { type: 'application/json' });
	// 	saveAs(blob, `${new Date().getTime()}.json`);
	// }
	//
	// ngOnInit() {
	//
	// 	this.onFileLoad$.subscribe();
	// 	Cesium.buildModuleUrl.setBaseUrl('assets/Cesium/');
	// 	Cesium.BingMapsApi.defaultKey = 'AnjT_wAj_juA_MsD8NhcEAVSjCYpV-e50lUypkWm1JPxVu0XyVqabsvD3r2DQpX-';
	//
	// 	this.viewer = new Cesium.Viewer(this.cesiumMap.nativeElement, {
	// 		terrainProvider: Cesium.createWorldTerrain()
	// 	});
	// }
	//
	// getPosition() {
	// 	const { canvas } = this.viewer;
	// 	const topLeft = this.viewer.camera.getPickRay({ x: 0, y: 0 });
	// 	const topRight = this.viewer.camera.getPickRay({ x: canvas.width, y: 0 });
	// 	const bottomRight = this.viewer.camera.getPickRay({ x: canvas.width, y: canvas.height });
	// 	const bottomLeft = this.viewer.camera.getPickRay({ x: 0, y: canvas.height });
	// 	const center = this.viewer.camera.getPickRay({ x: canvas.width / 2, y: canvas.height / 2 });
	//
	// 	const bboxCoordinates = [ topLeft, topRight, bottomRight, bottomLeft, topLeft ].map(this.toCartographicDegress.bind(this));
	// 	const centerCoordinates = this.toCartographicDegress(center);
	// 	const bboxPolygon = polygon(<any>[ bboxCoordinates ]);
	// 	const centerPoint = point(centerCoordinates);
	// 	return featureCollection([ bboxPolygon, centerPoint ]);
	// }
	//
	// toCartographicDegress(position): number[] {
	// 	const cartesian = this.viewer.scene.globe.pick(position, this.viewer.scene);
	// 	const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
	//
	// 	const longitude = Cesium.Math.toDegrees(cartographic.longitude);
	// 	const latitude = Cesium.Math.toDegrees(cartographic.latitude);
	// 	return [ longitude, latitude ];
	// }

}
