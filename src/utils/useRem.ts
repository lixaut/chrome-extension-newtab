/**
 * 可视化大屏响应式设置
 * 设计稿尺寸：1920 * 1080
 * 响应式单位：1rem = 96px
 */
export function useRem() {
  const PX = '16px';
  const html_dom = document.querySelector('html') as HTMLHtmlElement;
  const setRem = () => {
    const wInit: number = document.documentElement.clientWidth || window.innerWidth;
    html_dom.style.fontSize = wInit / 20 + 'px';
  };
  const removeRem: () => void = () => {
    html_dom.style.fontSize = PX;
    window.removeEventListener('resize', setRem);
  };
  const addRem: () => void = () => {
    html_dom.style.fontSize = PX;
    window.addEventListener('resize', setRem);
    setRem();
  };
  return { addRem, removeRem };
}
