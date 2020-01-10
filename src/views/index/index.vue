<template>
  <div class="page-body">
    <div class="scroll-box">
      <div
        class="image-wrapper"
        :class="{ active: showTransition }"
      >
        <img
          :src="bgImage"
          class="bg-image"
          @click="watchCommodity"
        />
        <div
          :style="{ 'background-image': 'url(\''+bgImage+'\')' }"
          class="blur-mask fixed-full"
        ></div>
      </div>
    </div>
    <template>
      <div class="audio-controller"></div>
      <div v-show="!showTransition" class="progress-bar">
        <span
          v-for="(n, index) in 5"
          :key="index"
          :class="{ active: index === currentIndex }"
          class="anchor-point"
        ></span>
      </div>
    </template>
  </div>
</template>

<script>
import Audio from '@/modules/audio-play';
import { isPassiveSupported } from '@/utils';

const passiveObj = isPassiveSupported() ? { passive: true } : false;

const anchors = [0, 400, 800, 1200, 1600];

export default {
  data() {
    return {
      bgImage: 'https://fedu.10155.com/resource/xll/Banner/20191220/e3b10becee5a7a792084f29e4eab8da7.gif?p=0',
      bgMusic: 'https://m701.music.126.net/20200110094810/0aceefb4a21d57ab4a02a9b1a23b8bac/jdyyaac/020f/0609/020b/5e6a84d7191c5f6a28845a388f75c32e.m4a',

      angle: 0,
      angleRange: 120,  // 角度范围，可设置
      scrollLeft: 600,  // 初始位置，可设置
      scrollRange: 0,
      currentIndex: -1,

      container: null,
      showTransition: false,
    }
  },
  watch: {
    angle(val, oldVal) {
      const changeAngle = val - oldVal;
      const changeScroll = -changeAngle / this.angleRange * this.scrollRange;
      this.container.scrollLeft += changeScroll;
    },
    scrollLeft: {
      handler(val) {
        let i = 0, len = anchors.length - 1;
        for(; i < len; i++ ) {
          if(val >= anchors[i] && val < anchors[i + 1]) {
            this.currentIndex = i;
            return;
          }
        }
        this.currentIndex = i;
      },
      immediate: true
    }
  },
  mounted() {
    const image = document.querySelector('.bg-image');
    this.container = document.querySelector('.scroll-box');
    this.scrollRange = image.getBoundingClientRect().width - this.container.getBoundingClientRect().width;

    this.container.scrollLeft = this.scrollLeft;
    this.container.addEventListener('scroll', this.handleScroll, passiveObj);
    window.addEventListener('deviceorientation', this.handleOrientation);

    // 初始化 audio 控件
    const controller = document.querySelector('.audio-controller');
    window.audio = new Audio({
      src: this.bgMusic,
      effect: 'cave',
      fillNum: 8,
      fillColor: '#F0B002',
      controller
    });
  },
  methods: {
    handleScroll() {
      this.scrollLeft = this.container.scrollLeft;
    },
    handleOrientation(e) {
      this.angle = e.alpha;
    },
    watchCommodity() {
      const wrapper = document.querySelector('.image-wrapper');
      const mask = document.querySelector('.blur-mask');
      // wrapper.style.transformOrigin = `${this.scrollLeft + e.clientX}px ${e.clientY}px`;
      wrapper.style.transformOrigin = `${this.scrollLeft + window.innerWidth / 2}px`;
      mask.style.marginLeft = this.scrollLeft + 'px';
      mask.style.backgroundPosition = -this.scrollLeft + 'px';
      this.showTransition = true;
      setTimeout(() => {
        this.$router.push('/commodity-1');
        this.showTransition = false;
      }, 2000);
    }
  }
}
</script>

<style lang="scss" scoped>
$bar-length: 15rem;
$point-num: 5;
$point-radius: .2rem;
$point-interval: ($bar-length - $point-num * $point-radius * 2) / 4;

.page-body {
  position: relative;
  .scroll-box {
    @include overflow-x-scroll;
    width: 100%;
    height: 100vh;
    .image-wrapper {
      height: inherit;
      .bg-image {
        height: inherit;
      }
      .blur-mask {
        display: none;
        background-size: cover;
        mask-image: radial-gradient(ellipse 50% 50%, transparent 10%, black 90%);
        filter: blur(8px);
      }
      &.active {
        animation: ease-in-scale linear 2s;
        .blur-mask {
          display: block;
        }
      }
    }
  }
  .audio-controller {
    position: absolute;
    top: 1rem; right: 1rem;
    width: 24px; height: 12px;
    line-height: 0;
  }
  .progress-bar {
    @include flex-box;
    @include margin-lr-center(absolute);
    bottom: 4rem;
    width: $bar-length;
    &::after {
      @include margin-tb-center(absolute);
      content: '';
      width: 100%;
      height: 2px;
      background-color: #aaa;
    }
    .anchor-point {
      position: relative;
      border: $point-radius solid #F0B002;
      border-radius: 50%;
      margin-right: $point-interval;
      transition: border-color .3s linear;
      z-index: 1;
      &::after {
        @include margin-tb-center(absolute);
        content: '';
        left: $point-radius;
        width: $point-interval;
        height: 2px;
        background-color: #F0B002;
        transition: width .3s linear;
      }
      &:last-of-type {
        margin-right: 0;
        &::after {
          content: none;
        }
      }
    }
    .anchor-point.active {
      &::before {
        content: '';
        @include transform-all-center(absolute);
        color: #F0B002;
        border: 1px solid currentColor;
        border-radius: 50%;
        animation: outline-scatter 1.2s ease-in .3s infinite;
        z-index: 0;
      }
      &::after {
        width: 0;
      }
      & ~ .anchor-point {
        border-color: #aaa;
        &::after {
          width: 0;
        }
      }
    }
  }
}
@keyframes ease-in-scale {
  from, to {
    transform: scale(1);
  }
  80% {
    transform: scale(1.2);
  }
}
@keyframes outline-scatter {
  from {
    box-shadow: .283rem 0 0 1px currentColor, -.283rem 0 0 1px currentColor, 0 .283rem 0 1px currentColor, 0 -.283rem 0 1px currentColor,
                .245rem .141rem 0 1px currentColor, -.245rem -.141rem 0 1px currentColor, .245rem -.141rem 0 1px currentColor, -.245rem .141rem 0 1px currentColor,
                .141rem .245rem 0 1px currentColor, -.141rem -.245rem 0 1px currentColor, -.141rem .245rem 0 1px currentColor, .141rem -.245rem 0 1px currentColor;
  }
  to {
    box-shadow: .849rem 0 0 -1px currentColor, -.849rem 0 0 -1px currentColor, 0 .849rem 0 -1px currentColor, 0 -.849rem 0 -1px currentColor,
                .735rem .423rem 0 -1px currentColor, -.735rem -.423rem 0 -1px currentColor, .735rem -.423rem 0 -1px currentColor, -.735rem .423rem 0 -1px currentColor,
                .423rem .735rem 0 -1px currentColor, -.423rem -.735rem 0 -1px currentColor, -.423rem .735rem 0 -1px currentColor, .423rem -.735rem 0 -1px currentColor;
  }
}
</style>

