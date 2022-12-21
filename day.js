
render()

function renderDay(data, nodeList) {
  const dataNumArr = data.toString().split('')
  const nodeArr = [...nodeList]
  for (let i = 0; i < nodeArr.length; i++) {
    nodeArr[i].className = `iconfont icon-shuzi${dataNumArr[i]}`
  }
}

function renderWeek(data, weekNode) {
  const weekTextArr = ['_Sun', '_Mon', '_Tue', '_Wed', '_Thur', '_Fri', '_Sat']
  let text = weekTextArr[data]
  dataStr = data.toString()
  let week_num = dataStr === '0' ? '7' : dataStr
  let str = `iconfont icon-week${week_num}`
  let node_i = weekNode.querySelector('.iconfont')
  node_i.className = str
  node_i.innerText = text
}

function render() {
  const dayNode = document.querySelector('#day')
  const weekNode = document.querySelector('#week')
  const yearNodeList = dayNode.querySelectorAll('.year')
  const monthNodeList = dayNode.querySelectorAll('.month')
  const dayNodeList = dayNode.querySelectorAll('.day')
  const time = new Date()
  const [year, month, day, week] = [
    time.getFullYear(),
    time.getMonth(),
    time.getDate(),
    time.getDay()
  ]
  renderDay(year, yearNodeList)
  renderDay(month, monthNodeList)
  renderDay(day, dayNodeList)
  renderWeek(week, weekNode)
}

