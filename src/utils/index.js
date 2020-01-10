
export const isEmptyObj = obj => Object.keys(obj).length === 0;

// 获取根字体大小
export function getRootFontSize() {
  return document ? parseFloat(document.documentElement.style.fontSize.replace('px', '')) : 0;
}

// 防抖
export function debounce(func, timeout = 100) {
  let timer = null;
  return function(...args) {
    timer && clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  }
}

// 节流
export function throttle(func, timeout = 100) {
  let _lock = false;
  return function(...args) {
    if (_lock) return;
    _lock = true;
    setTimeout(() => _lock = false, timeout);
    func.apply(this, args);
  }
}

/** format the proxy values of this Promise Object
 * @param {Promise} promiseObj a Promise Object
 * @return {Array} the formatted proxy values
 */
export function formatPromise(promiseObj) {
  return new Promise(resolve => {
    promiseObj.then(value => resolve([value, null]), error => resolve([null, error]));
  });
}

/** Prevent the asynchronous function to be called in its calls
 * @param {Function} asyncFunc a asynchronous function
 * @param {Object} thisArg the 'this' argument while calling asyncFunc
 * @return {Function} a processed asynchronous function
 */
export function lock(asyncFunc, thisArg) {
  let _lock = false;
  return async function(...args) {
    if (_lock) return;
    _lock = true;
    let res;
    try {
      res = await asyncFunc.apply(thisArg || this, args);
    } catch (err) {
      res = Promise.reject(err);
    }
    _lock = false;
    return res;
  }
}

// 带钥匙的锁
export function lockWithKey(asyncFunc, thisArg) {
  let _lock = false;
  return async function(...args) {
    if (_lock) return;
    _lock = true;
    function openLock() {
      _lock = false;
    }
    let res;
    try {
      args.unshift(openLock);
      res = await asyncFunc.apply(thisArg || this, args);
    } catch (err) {
      res = Promise.reject(err);
    }
    openLock();
    return res;
  }
}

// 判断是否支持 passive
export function isPassiveSupported() {
  let passiveIsSupported = false;
  try {
    const options = Object.defineProperty({}, 'passive', {
      get() {
        return passiveIsSupported = true;
      }
    });
    window.addEventListener('test', null, options);
  } catch (err) {
    // noop
  }
  return passiveIsSupported;
}

// 判断是否支持 behavior，值为 smooth 时丝滑顺畅地滚动
export function isScrollBehaviorSupported() {
  let scrollBehaviorIsSupported = false;
  try {
    const options = Object.defineProperty({}, 'behavior', {
      get() {
        return scrollBehaviorIsSupported = true;
      }
    });
    document.body.scrollIntoView(options);
  } catch (err) {
    // noop
  }
  return scrollBehaviorIsSupported;
}

/** 元素在垂直方向上平滑地滚动到指定高度
 * @param {number} element 滚动元素
 * @param {number} position 所要滚动到的高度
 */
export function scrollSmoothTo(element, position) {
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback) {
      return setTimeout(callback, 1000 / 60);
    };
  }
  let scrollTop = element.scrollTop;
  function _step() {
    const distance = position - scrollTop;
    scrollTop += distance / 5;
    if (Math.abs(distance) < 1) {
      element.scrollTop = position;
    } else {
      element.scrollTop = scrollTop;
      window.requestAnimationFrame(_step);
    }
  }
  _step();
}
