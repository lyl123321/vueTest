/**
 * @param {string} config.src 需要播放的音频地址，需要同域，或允许跨域请求（accect: *\/*），如果是跨域的音频地址，将只支持基础的功能；
 * @param {object|string} [config.controller] 显示波形的容器；
 * @param {boolean} [config.autoPlay=true] 是否自动播放；
 * @param {boolean} [config.loop=true] 是否循环播放；
 * @param {string} [config.effect='none'] 给音频添加的效果（'cave', 'lodge', 'parking', 'lowpass', 'telephone', 'spatialized', 'backwards', 'wildecho'）；
 * @param {string} [config.fillColor] 波形填充颜色，eg.'#ff0000'；
 * @param {number} [config.fillNum=12] 容器宽度最好为fillNum的整数倍，eg. fillNum=12，容器宽度为60px
 * @example
		var audio = new mo.Audio({
			src: 'http://ossweb-img.qq.com/images/audio/motion/audio4.mp3',
			controller: $('.bg-music')
		});
*/
import observerFactory from './observerFactory';

var requestAnimationFrame = window.requestAnimationFrame
	|| window.mozRequestAnimationFrame
		|| window.webkitRequestAnimationFrame
			|| function(callback) {
					return setTimeout(callback, 1000 / 60);
				};

// 混响效果音频文件
var effects = {
	'cave': 'http://ossweb-img.qq.com/images/audio/motion/effect1.wav',
	'lodge': 'http://ossweb-img.qq.com/images/audio/motion/effect2.wav',
	'parking': 'http://ossweb-img.qq.com/images/audio/motion/effect3.wav',
	'lowpass': 'http://ossweb-img.qq.com/images/audio/motion/lowpass.wav',
	'telephone': 'http://ossweb-img.qq.com/images/audio/motion/telephone.wav',
	'spatialized': 'http://ossweb-img.qq.com/images/audio/motion/spatialized.wav',
	'backwards': 'http://ossweb-img.qq.com/images/audio/motion/backwards.wav',
	'wildecho': 'http://ossweb-img.qq.com/images/audio/motion/wildecho.wav'
};

var color = ['#ff0000', '#ff3300', '#ff6600', '#ff9900', '#ffcc00', '#ffff00', '#ccff00', '#99ff00', '#66ff00', '#33ff00', '#00ff00'];

function Audio(config) {
	this._create = function() {
		var self = this;
		var config = self.config;
		if(self.audioContext && config.useWebAudio) {
			self._get(config.src, function(data) {
				self.arrayBuffer = data;
				self.$trigger('init');
			}, function(error) {
				// 如果该音频不允许跨域访问
				config.useWebAudio = false;
				self._create();
			});
		} else {
			self.audio = document.createElement('audio');
			self.audio.src = config.src;
			window.setTimeout(function(){
				self.$trigger('init');
			}, 0);
		}
	}
	this._autoPlay = function() {
		function _play() {
			// 不管是点 controller 还是其它地方，都会先播放再删除监听器
			this.play();
			window.removeEventListener('click', callback);
		}
		var callback = _play.bind(this);
		window.addEventListener('click', callback);
	}
	this._attach = function() {
		var self = this;
		var config = self.config;
		config.controller.addEventListener('click', function() {
			if(self.isPlaying) {
				self.pause()
			} else {
				self.play();
			}
		});
	}
	this._getWave = function(){
		var self = this;
		var audioContext = self.audioContext;
		var analyser = self.analyser = audioContext.createAnalyser();
		// var processor=audioContext.createScriptProcessor(4096,1,1);
		//连接：媒体节点→控制节点→输出源
		// sound.connect(processor);
		// processor.connect(audioContext.destination);
		analyser.smoothingTimeConstant = 0.85;
		analyser.fftSize = 32;
		self.frequencyData = new Uint8Array(analyser.frequencyBinCount);
		analyser.getByteFrequencyData(self.frequencyData);
		self.sound.connect(analyser);
		analyser.connect(audioContext.destination);

	}
	this._createCanvas = function() {
		var self = this;
		var config = self.config;
		var controller = config.controller;

		var canvas = self.canvas = document.createElement('canvas');
		canvas.width = controller.offsetWidth;
		canvas.height = controller.offsetHeight;
		controller.append(canvas);

		var ctx = canvas.getContext("2d");
		ctx.imageSmoothingEnabled = ctx.mozImageSmoothingEnabled = false;
	}
	this._draw = function() {
		var self = this;
		var config = self.config;
		if(!self.canvas) {
			self._createCanvas();
		}
		var canvas = self.canvas;
		var ctx = canvas.getContext("2d");

		function _drawSpectrum() {
			if(!self.isPlaying || !self.isAnimate) return;

			// 获取当前频域数据
			var frequencyBinCount = 16;
			if(config.useWebAudio) {
				// 将当前频域数据拷贝进 frequencyData 数组
				self.analyser.getByteFrequencyData(self.frequencyData);
				frequencyBinCount = self.analyser.frequencyBinCount;
			} else {
				if(!self.frequencyData) {
					self.frequencyData = [255, 254, 211, 153, 127, 109, 76, 35, 5, 0, 0, 0, 0, 0, 0, 0];
				}
				var frequencyData = self.frequencyData;
				for(var i = 0; i < frequencyData.length; i++) {
					var val = frequencyData[i];
					val += Math.random() * 20 -  10;
					val = val > 255 ? 255 : val;
					val = val < 0 ? 0 : val;
					frequencyData[i] = val;
				}
			}

			// 绘制频谱
			const W = canvas.width;
			const H = canvas.height;
			ctx.clearRect(0, 0, W, H);
			var bar_width = Math.floor(W / config.fillNum);
			var freq, x, y, w, h;
			for (var i = 0; i < frequencyBinCount; i++) {
				freq = self.frequencyData[i] || 0;
				x = bar_width * i;
				if (x + bar_width > W) continue;
				w = bar_width - 1;
				h = Math.floor(freq / 255 * H) + 1;
				y = Math.round((H - h) / 2);
				ctx.fillStyle = config.fillColor || color[i] || '#ff0000';
				ctx.fillRect(x, y, w, h);
			}

			requestAnimationFrame(_drawSpectrum);
		}
		_drawSpectrum();
	}
	this._get = function(url, success, error) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);
		xhr.responseType = 'arraybuffer';
		xhr.onload = function() {
			success && success(xhr.response);
		};
		xhr.onerror = function(e) {
			error && error(e);
		};
		xhr.send();
	}

	this.init(config);
}

Audio.config = {
	// src 音频地址
	// controller 波形容器
	autoPlay: true,
	loop: true,
	effect: 'none',
	useWebAudio: true,
	// fillColor: '#00aaff',
	fillNum: 12
};

Audio.prototype = {
	constructor: Audio,

	/***
	 * 初始化
	 * @description 参数处理
	 */
	init(config) {
		var self = this;
		self.config = null;
		self.canvas = null;
		self.audio = null;		// AudioContext 不可用时使用的 audio 元素
		self.audioContext = null;		// 包含各个 AudioNode 的上下文
		self.arrayBuffer = null;		// 音频文件的 ArrayBuffer
		self.audioBuffer = null;		// 音频文件的 AudioBuffer
		self.sound = null;		// 音频源节点
		self.convolver = null;		// 实现音频混响的节点
		self.analyser = null;		// 提供实时频域和时域分析信息的节点
		self.frequencyData = null;		// 无符号字节数组 格式的频率数据
		self.currentTime = 0;
		self.isPlaying = false;
		self.isAnimate = true;

		var config = self.config = Object.assign({}, Audio.config, config); // 参数接收
		try {
			self.audioContext = new (window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext)();
		} catch(e){
			// 如果访问环境支持 AudioContext
			config.useWebAudio = false;
		}
		config.fillNum = parseInt(config.fillNum) || 4;

		observerFactory(self);
		self.$trigger('beforeinit');
		self._create();
		self.$on('init', function() {
			if(!config.useWebAudio) {
				self.audio.loop = config.loop;
			}
			if(config.autoPlay) {
				self._autoPlay();
			}
			self._attach();

			function _step() {
				var lastTime = self.currentTime;
				if(self.audio) {
					self.currentTime = self.audio.currentTime;
				} else {
					self.currentTime = self.audioContext.currentTime;
				}
				if(lastTime !== self.currentTime && self.frequencyData) {
					self.$trigger('progress', self.frequencyData);
				}
				
				requestAnimationFrame(_step);
			}
			_step();
		});
	},

	/**
	 * 播放音频
	 */
	play() {
		var self = this;
		var config = self.config;
		var currentTime = self.currentTime || 0;
		if(self.isPlaying) return;
		self.isPlaying = true;
		if(config.useWebAudio) {
			function _play() {
				var self = this;
				var sound = self.sound = self.audioContext.createBufferSource();
				sound.buffer = self.audioBuffer;
				sound.connect(self.audioContext.destination);
				sound.loop = config.loop;
				// 应用混响效果
				if(config.effect != 'none') self.applyEffect(config.effect);
				// 开始播放
				sound.start(0, currentTime);
				// 获取频率数据
				self._getWave();
				if(config.controller) self._draw();
			}
			if(self.audioBuffer) {
				_play.call(self);
			} else {
				self.audioContext.decodeAudioData(self.arrayBuffer, function(buffer) {
					self.audioBuffer = buffer;
					_play.call(self);
				});	
			}
		} else {
			self.audio.currentTime = currentTime; 
			self.audio.play();
			if(config.controller) {
				self._draw();
			}
		}
	},

	/**
	 * 暂停音频
	 */
	pause() {
		var self = this;
		var config = self.config;	
		self.isPlaying = false;
		if(config.useWebAudio) {
			self.sound.stop();
			self.currentTime = self.audioContext.currentTime;
		} else {
			self.currentTime = self.audio.currentTime;
			self.audio.pause();
		}
	},

	/**
	 * 停止音频
	 */
	stop() {
		this.pause();
		this.currentTime = 0;
	},

	/**
	 * 打开动画
	 */
	openAnimation() {
		this.isAnimate = true;
	},
	/**
	 * 关闭动画
	 */
	closeAnimation() {
		this.isAnimate = false;
		if(this.canvas) {
			this.canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
		}
	},

	/**
	 * 应用音频效果，可选效果：'cave', 'lodge', 'parking', 'lowpass', 'telephone', 'spatialized', 'backwards', 'wildecho'
	 * @param {string} url
	 */
	applyEffect(url) {
		var self = this;
		if(!/^http/i.test(url)) {
			url = effects[url];
		}
		if(!url) {
			return;
		}
		if(self.convolver) {
			self.convolver.disconnect();
		}
		var convolver = self.convolver = self.audioContext.createConvolver();
		self._get(url, function(data){
			self.audioContext.decodeAudioData(data, function (buffer) {
				convolver.buffer = buffer;
				self.sound.connect(convolver);
				convolver.connect(self.audioContext.destination);
			});
		});
	}
}

export default Audio;