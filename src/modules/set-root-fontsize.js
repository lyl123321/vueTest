/**
 * 设置html font-size 以适应屏幕尺寸
 */
import { debounce } from '@/utils';

const sizeControll = {
  minWidth: 320,
  maxWidth: 800,
  setHtmlFontSize() {
    let innerWidth = document.documentElement.getBoundingClientRect().width || window.innerWidth;
    if (!innerWidth) return;
    if (innerWidth <= sizeControll.minWidth) {
      innerWidth = sizeControll.minWidth;
    } else if (innerWidth >= sizeControll.maxWidth) {
      innerWidth = sizeControll.maxWidth;
    }
    document.documentElement.style.fontSize = (innerWidth * 20 / 375) + 'px';
  }
};

// 各种调用
sizeControll.setHtmlFontSize();
setTimeout(sizeControll.setHtmlFontSize, 500);
window.addEventListener('load', sizeControll.setHtmlFontSize);
window.addEventListener('resize', debounce(sizeControll.setHtmlFontSize));

export default sizeControll;