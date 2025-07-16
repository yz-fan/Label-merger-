// popup.js
document.addEventListener('DOMContentLoaded', async () => {
    const tabsList = document.getElementById('tabsList');
    const groupTabsButton = document.getElementById('groupTabsButton');
    const ungroupAllButton = document.getElementById('ungroupAllButton');
    const loadingMessage = document.getElementById('loadingMessage');
    const messageArea = document.getElementById('messageArea');
    const messageText = document.getElementById('messageText');

    let selectedTabIds = new Set();
    let allTabs = [];

    // --- 消息提示函数 ---
    const showMessage = (msg, type = 'info') => {
        messageText.textContent = msg;
        messageArea.classList.remove('hidden', 'bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800', 'bg-blue-100', 'text-blue-800');
        if (type === 'success') {
            messageArea.classList.add('bg-green-100', 'text-green-800');
        } else if (type === 'error') {
            messageArea.classList.add('bg-red-100', 'text-red-800');
        } else { // info
            messageArea.classList.add('bg-blue-100', 'text-blue-800');
        }
        messageArea.classList.remove('hidden');
        // 2秒后自动隐藏消息
        setTimeout(() => {
            messageArea.classList.add('hidden');
        }, 2000);
    };

    // 获取并显示所有标签页
    const loadTabs = async () => {
        loadingMessage.style.display = 'block';
        tabsList.innerHTML = ''; // 清除之前的列表
        selectedTabIds.clear(); // 清除所有选择

        try {
            // 获取当前窗口的所有标签页
            const tabs = await chrome.tabs.query({ currentWindow: true });
            allTabs = tabs; // 存储所有标签页以备后用

            if (tabs.length === 0) {
                tabsList.innerHTML = '<p class="p-4 text-gray-500 text-sm">当前窗口没有打开的标签页。</p>';
            } else {
                tabs.forEach(tab => {
                    const tabItem = document.createElement('div');
                    tabItem.className = 'tab-item';
                    tabItem.dataset.tabId = tab.id;

                    // Tab favicon
                    const favicon = document.createElement('img');
                    favicon.className = 'tab-favicon';
                    // 使用Google S2 Favicon服务作为可靠的favicon源，并提供一个SVG作为最终回退
                    favicon.src = tab.favIconUrl ? `https://s2.googleusercontent.com/s2/favicons?domain=${new URL(tab.url).hostname}&sz=16` : '';
                    favicon.onerror = () => {
                        // Fallback to a simple SVG question mark if Google S2 fails or no favIconUrl
                        favicon.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Ccircle cx=\'12\' cy=\'12\' r=\'10\'%3E%3C/circle%3E%3Cpath d=\'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3\'%3E%3C/path%3E%3Cline x1=\'12\' y1=\'17\' x2=\'12.01\' y2=\'17\'%3E%3C/line%3E%3C/svg%3E';
                    };

                    // Tab title
                    const titleSpan = document.createElement('span');
                    titleSpan.className = 'tab-title';
                    titleSpan.textContent = tab.title || tab.url; // 如果标题缺失，使用URL
                    titleSpan.title = tab.title || tab.url; // 鼠标悬停时显示完整标题

                    tabItem.appendChild(favicon);
                    tabItem.appendChild(titleSpan);

                    tabItem.addEventListener('click', () => {
                        const tabId = parseInt(tabItem.dataset.tabId);
                        if (selectedTabIds.has(tabId)) {
                            selectedTabIds.delete(tabId);
                            tabItem.classList.remove('selected');
                        } else {
                            selectedTabIds.add(tabId);
                            tabItem.classList.add('selected');
                        }
                    });
                    tabsList.appendChild(tabItem);
                });
            }
        } catch (error) {
            console.error('加载标签页失败:', error);
            showMessage('加载标签页失败，请检查权限。', 'error');
        } finally {
            loadingMessage.style.display = 'none';
        }
    };

    // 合并选定的标签页
    groupTabsButton.addEventListener('click', async () => {
        if (selectedTabIds.size === 0) {
            showMessage('请选择至少一个标签页进行合并！', 'info');
            return;
        }

        const tabIdsToGroup = Array.from(selectedTabIds);

        try {
            const group = await chrome.tabs.group({ tabIds: tabIdsToGroup });
            console.log('标签页已合并到组:', group);
            showMessage('标签页合并成功！', 'success');
            // 刷新标签页列表以显示新的组
            await loadTabs();
        } catch (error) {
            console.error('合并标签页失败:', error);
            showMessage('合并标签页失败，请确保您选择了有效的标签页。', 'error');
        }
    });

    // 解散所有标签页组
    ungroupAllButton.addEventListener('click', async () => {
        try {
            // 获取当前窗口中所有属于组的标签页
            const allTabsInWindow = await chrome.tabs.query({ currentWindow: true });
            const groupedTabIds = allTabsInWindow.filter(tab =>
                typeof tab.groupId === 'number' && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE
            ).map(tab => tab.id);

            if (groupedTabIds.length === 0) {
                showMessage('当前窗口没有找到任何标签页组。', 'info');
                return;
            }

            // 解散这些标签页
            await chrome.tabs.ungroup(groupedTabIds);
            console.log('所有标签页组已解散。');
            showMessage('所有标签页组已成功解散！', 'success');
            // 刷新标签页列表
            await loadTabs();
        } catch (error) {
            console.error('解散标签页组失败:', error);
            showMessage('解散标签页组失败。', 'error');
        }
    });

    // 初始加载标签页
    loadTabs();
});
