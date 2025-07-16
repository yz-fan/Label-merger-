// background.js
// 这个脚本目前是空的，但对于更复杂的逻辑，你可以在这里添加事件监听器或消息处理。
// 例如，如果需要监听标签页创建/关闭事件来自动管理组。
// 对于这个简单的合并功能，大部分逻辑都在 popup.js 中。
console.log("标签页合并器后台服务工作者已启动。");

// 示例：监听标签页创建事件 (可选)

chrome.tabs.onCreated.addListener((tab) => {
  console.log("新标签页创建:", tab.url);
});
