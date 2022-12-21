
const bookmarkNode = document.querySelector('#bookmark')
chrome.bookmarks.getTree().then((bookList) => {
  const [bookTree] = bookList
  const bookTabs = getBookTabs(bookTree)
  renderTabs(bookmarkNode, bookTabs)
})
bookmarkNode.addEventListener('click', async (e) => {
  let ele = e.target
  if (id = ele.getAttribute('id')) {
    const folderChildren = await getFolderChildren(id)
    renderUrls(ele, folderChildren)
  }
})

// 获取书签栏数据
function getBookTabs(bookTree) {
  const res = bookTree.children.filter((item) => {
    return item.title === '书签栏'
  })
  const [tabTree] = res
  return tabTree.children
}
// 渲染书签栏
function renderTabs(node, bookTabs) {
  let str = ''
  bookTabs.forEach((item) => {
    str += item.children ? 
    `
      <div class="bookmark-item" id="${item.id}">
        <i class="iconfont icon-folder"></i>
        <span>${item.title}</span>
        <ul class="url-list">
        </ul>
      </div>
    ` :
    `
      <div class="bookmark-item">
        <a href="${item.url}">
          <i class="iconfont icon-chaolianjie"></i>
          <span>${item.title}</span>
        </a>
      </div>
    `
  })
  node.innerHTML = str
}
// 渲染书签文件夹中的书签
function renderUrls(node, urls) {
  let str = ''
  urls.forEach(item => {
    str += `
      <li>
        <a href="${item.url}">
          <i class="iconfont icon-chaolianjie"></i>
          <span>${item.title}</span>
        </a>
      </li>
    `
  })
  const ul = node.querySelector('.url-list')
  ul.innerHTML = str
}
// 获取书签文件夹中的每个文件
async function getFolderChildren(parentId) {
  const children = await chrome.bookmarks.getChildren(parentId)
  return children
}