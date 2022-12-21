
const timer = setInterval(() => {
  renderTime()
}, 1000)

/**
 * 格式化时间
 * @param {number} num 
 * @returns 两位数的字符串
 */
function timeFormt(num) {
  let numStr = num.toString()
  if (numStr.length === 2) return numStr
  return 0 + numStr
}

/**
 * 生成新时间字符
 * @returns 一个新的时间字符数组
 */
function genNewTime() {
  let time = new Date()
  const [[h1, h2], [m1, m2], [s1, s2]] = [
    timeFormt(time.getHours()).split(''),
    timeFormt(time.getMinutes()).split(''),
    timeFormt(time.getSeconds()).split('')
  ]
  return [h1, h2, m1, m2, s1, s2]
}

/**
 * 获取就时间字符
 * @param {arrayLike} nodeList 时间数字DOM节点伪数组
 * @returns 原来时间字符数组
 */
function getOldTime(nodeList) {
  return [...nodeList].map(item => {
    return item.getAttribute('name')
  })
}

/**
 * 对比新旧字符
 * @param {array} newTimeArr 新时间字符数组
 * @param {array} oldTimeArr 旧时间字符数组
 * @returns 新旧字符对比结果数组
 */
function differ(newTimeArr, oldTimeArr) {
  const isRenderArr = []
  for (let i = 0; i < newTimeArr.length; i++) {
    isRenderArr[i] = newTimeArr[i] === oldTimeArr[i]
  }
  return isRenderArr
}

/**
 * 更新页面单个字符
 * @param {object} node 时间数字DOM节点
 * @param {string} num 时间数字字符
 */
function update(node, num) {
  const nodeI = node.querySelector('i')
  node.setAttribute('name', num)
  nodeI.className = `iconfont icon-shuzi${num}`
}

/**
 * 渲染页面
 */
function renderTime() {
  const nums = document.querySelectorAll('.num')
  oldTimeArr = getOldTime(nums)
  newTimeArr = genNewTime()
  const resArr = differ(newTimeArr, oldTimeArr)
  for (let i = 0; i < resArr.length; i++) {
    if (resArr[i]) continue
    update(nums[i], newTimeArr[i])
  }
}