/* 全景图 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof global.define === 'function' && global.define.amd ? global.define(factory) :
	(global = global || self, global.Opanorama = factory());
}(this, (function () { 'use strict';

	class Orienter {
		constructor(config) {
			this._config = Object.assign({
				onChange() {
				},
				onOrient() {
				}
			}, config);

			this.lon = this.lat = 0;
			this.moothFactor = 10;
			this.boundary = 320;
			this.direction = window.orientation || 0;
			this.bind();
		}


		bind() {
			window.addEventListener('deviceorientation', this._bindChange = this._onChange.bind(this));
			window.addEventListener('orientationchange', this._bindOrient = this._onOrient.bind(this));
		}


		destroy() {
			window.removeEventListener('deviceorientation', this._bindChange, false);
			window.removeEventListener('orientationchange', this._bindOrient, false);
		}


		_onOrient(event) {
			this.direction = window.orientation;
			this._config.onOrient(event);
			this.lastLon = this.lastLat = undefined;
		}

		_mooth(x, lx) { //插值为了平滑些

			if (lx === undefined) {
				return x;
			}

			//0至360,边界值特例，有卡顿待优化
			if (Math.abs(x - lx) > this.boundary) {
				if (lx > this.boundary) {
					lx = 0;
				}else {
					lx =360;
				}
			}


			//滤波降噪
			x = lx + (x-lx) / this.moothFactor;
			return x;
		}

		_onChange(evt) {
			switch (this.direction) {
				case 0 :
					this.lon = -(evt.alpha + evt.gamma);
					this.lat = evt.beta - 90;
					break;
				case 90:
					this.lon = evt.alpha - Math.abs(evt.beta);
					this.lat = evt.gamma < 0 ? -90 - evt.gamma : 90 - evt.gamma;
					break;
				case -90:
					this.lon = -(evt.alpha + Math.abs(evt.beta));
					this.lat = evt.gamma > 0 ? evt.gamma - 90 : 90 + evt.gamma;
					break;
			}

			this.lon = this.lon > 0 ? this.lon % 360 : this.lon % 360 + 360;

			//插值为了平滑，修复部分android手机陀螺仪数字有抖动异常的
			this.lastLat = this.lat = this._mooth(this.lat, this.lastLat);
			this.lastLon = this.lon = this._mooth(this.lon, this.lastLon);

			this._config.onChange({
				lon: this.lon,
				lat: this.lat
			});
		}
	}

	class Toucher {
		constructor(config) {
			this.config = Object.assign({
				radius: 50,
				container: document.body,
				onStart() {
				},
				onMove() {
				},
				onEnd() {
				},
				onChange() {
				}
			}, config);
			this.lat = this.lon = 0;
			this.lastX = this.lastY = 0;
			this.lastDistance = 0;
			this.startX = this.startY = 0;
			this.speed = {lat: 0, lon: 0};
			this.deceleration = 0.5;
			this.factor = 50 / this.config.radius;
			this.bind();
		}

		bind() {
			const {container} = this.config;
			container.addEventListener('touchstart', this._bindStart = this._onStart.bind(this));
			container.addEventListener('touchmove', this._bindMove = this._onMove.bind(this));
			container.addEventListener('touchend', this._bindEnd = this._onEnd.bind(this));

		}

		unbind() {
			const {container} = this.config;
			container.removeEventListener('touchstart', this._bindStart);
			container.removeEventListener('touchmove', this._bindMove);
			container.removeEventListener('touchend', this._bindEnd);
		}

		_onStart(event) {
			const evt = event.changedTouches[0];
			this.startX = this.lastX = evt.clientX;
			this.startY = this.lastY = evt.clientY;
			this.startTime = Date.now();
			this.config.onStart(event);
			this.speed = {lat: 0, lon: 0};
			this.lastDistance = undefined;
		}

		_onMove(event) {
			event.preventDefault();
			const evt = event.changedTouches[0];
			switch (event.changedTouches.length) {
				case 1 :
					if (!this.lastDistance) {
						this.lon += (this.lastX - evt.clientX) * this.factor;
						this.lat += (evt.clientY - this.lastY) * this.factor;

						this.lastX = evt.clientX;
						this.lastY = evt.clientY;

						this.config.onChange({
							lat: this.lat,
							lon: this.lon
						});
					}
					break;
				case 2:
					const evt1 = event.changedTouches[1];
					let distance = Math.abs(evt.clientX - evt1.clientX) + Math.abs(evt.clientY - evt1.clientY);
					if (this.lastDistance === undefined) {
						this.lastDistance = distance;
					}
					let scale = distance / this.lastDistance;

					if (scale) {
						this.config.onChange({scale});
						this.lastDistance = distance;
					}
			}
			this.config.onMove(event);
		}

		_onEnd(event) {
			//惯性
			let t = (Date.now() - this.startTime) / 10;
			this.speed = {
				lat: (this.startY - this.lastY) / t,
				lon: (this.startX - this.lastX) / t
			};

			this._inertance();
			this.config.onEnd(event);
		}

		_subSpeed(speed) {
			if (speed !== 0) {
				if (speed > 0) {
					speed -= this.deceleration;
					speed < 0 && (speed = 0);
				} else {
					speed += this.deceleration;
					speed > 0 && (speed = 0);
				}
			}
			return speed;
		}

		_inertance() {
			const speed = this.speed;
			speed.lat = this._subSpeed(speed.lat);
			speed.lon = this._subSpeed(speed.lon);

			this.lat -= speed.lat;
			this.lon += speed.lon;


			this.config.onChange({
				isUserInteracting: false,
				speed,
				lat: this.lat,
				lon: this.lon
			});

			if (speed.lat === 0 && speed.lon === 0) {
				this._intFrame && cancelAnimationFrame(this._intFrame);
				this._intFrame = 0;
			} else {
				this._intFrame = requestAnimationFrame(this._inertance.bind(this));
			}
		}
	}

	var THREE = require('three');

	class Opanorama {
		constructor(config) {
			this._config = Object.assign({
				url: '',                    //全景图片
				container: document.body,   //容器
				radius: 500,                //球体半径
				fov: 90,                    //相机视角，可用于放大和缩小图片
				offsetLongitude: 0,         //经度偏移量，可用于默认展示图片位置
				offsetLatitude: 0,          //纬度偏移量，可用于默认展示图片位置
				supportTouch: true,         //是否支持手指滑动
				supportOrient: true,        //是否支持陀螺仪
				onFrame(lon, lat) {
					return {lon, lat};
				}
			}, config);


			this._config.width = config.container.clientWidth;
			this._config.height = config.container.clientHeight;


			config = this._config;

			this._fix = {
				lat: config.offsetLatitude || 0,
				lon: config.offsetLongitude || 180,
				isFixed: config.offsetLatitude || config.offsetLongitude
			};

			this._touch = this._orient = {
				lat: 0,
				lon: 0
			};

			this._initStage();
			this.resize();
			this._animate();
			this._initControl();
		}


		update(config = {}) {
			this._config = Object.assign({}, this._config, config);

			if (config.width || config.height) {
				this.renderer.setSize(this._config.width, this._config.height);
				this.camera.aspect = this._config.width / this._config.height;
			}
			if (config.fov) {
				this.camera.fov = config.fov;
			}
			this.camera.updateProjectionMatrix();
			this.resize();
		}

		resize() {
			this.camera.lookAt(this.camera.target);
			this.renderer.render(this.scene, this.camera);
		}

		_initStage() {
			const {container, width, height, url, fov, radius} = this._config;
			this.camera = new THREE.PerspectiveCamera(fov, width / height, 1, 1100);
			this.camera.target = new THREE.Vector3(0, 0, 0);
			this.scene = new THREE.Scene();

			var geometry = new THREE.SphereBufferGeometry(radius, 60, 40);
			geometry.scale(-1, 1, 1);
			var material = new THREE.MeshBasicMaterial({
				map: new THREE.TextureLoader().load(url)
			});
			var mesh = new THREE.Mesh(geometry, material);
			this.scene.add(mesh);

			this.renderer = new THREE.WebGLRenderer();
			this.renderer.setPixelRatio(window.devicePixelRatio);
			this.renderer.setSize(width, height);
			this.canvas = this.renderer.domElement;
			container.appendChild(this.canvas);

			window.addEventListener('resize', this._bindResize = this._onResize.bind(this));
		}

		_onResize() {
			const {container} = this._config;
			this.update({
				width: container.clientWidth,
				height: container.clientHeight
			});
		}

		_initControl() {
			const self = this;
			const config = this._config;

			if (config.supportTouch) {
				let fov;
				this._toucher = new Toucher({
					container: config.container,
					radius: config.radius,
					onChange({lon, lat, scale}) {
						if (scale) {
							fov = self._config.fov / scale;
							fov = Math.min(120, Math.max(fov, 60));
							self.update({fov});
						}

						if (lon !== undefined && lat !== undefined) {
							//超出范围，用fix来补
							if (self._fix.lat + self._orient.lat + lat > 90) {
								self._fix.lat = 90 - self._orient.lat - lat;
							} else if (self._fix.lat + self._orient.lat + lat < -90) {
								self._fix.lat = -90 - self._orient.lat - lat;
							}
							self._touch = {lon, lat};
						}
					}
				});
			}

			if (config.supportOrient) {
				this._orienter = new Orienter({
					onChange({lat, lon}) {
						const {_fix} = self;
						if (!_fix.isFixed) {
							self._fix = {
								lat: _fix.lat - lat,
								lon: _fix.lon - lon,
								isFixed: true
							};
						}
						if (Math.abs(self._orient.lat - lat) >= 90) {
							return;
						}
						//超出范围，用fix来补
						if (self._fix.lat + self._touch.lat + lat > 90) {
							self._fix.lat = 90 - self._touch.lat - lat;
						} else if (self._fix.lat + self._touch.lat + lat < -90) {
							self._fix.lat = -90 - self._touch.lat - lat;
						}

						self._orient = {lat, lon};
					}
				});
			}

		}

		destroy() {
			this._toucher && this._toucher.unbind();
			this._orienter && this._orienter.destroy();
			this._bindResize && window.removeEventListener('resize', this._bindResize);
			cancelAnimationFrame(this._intFrame);
		}

		_animate() {
			const config = this._config;
			let lat = this._touch.lat + this._fix.lat + this._orient.lat;
			let lon = this._touch.lon + this._fix.lon + this._orient.lon;

			//外部传的经纬度
			let obj = config.onFrame(lon, lat)||{};
			lon += (obj.lon || 0);
			lat += (obj.lat || 0);


			lat = Math.max(-89, Math.min(89, lat));

			lat = THREE.Math.degToRad(lat);
			lon = THREE.Math.degToRad(lon);

			this.camera.target.x = 500 * Math.cos(lat) * Math.cos(lon);
			this.camera.target.y = 500 * Math.sin(lat);
			this.camera.target.z = 500 * Math.cos(lat) * Math.sin(lon);

			this.resize();
			this._intFrame = requestAnimationFrame(this._animate.bind(this));
		}

	}
	window.Opanorama = Opanorama;

	return Opanorama;

})));
