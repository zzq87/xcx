// app.js
App({
  onLaunch() {
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
  },
  globalData: {
    userInfo: null
  },

  /**
   * 处理账户余额变动（支持添加记录、编辑记录）
   * @param {Object} oldRecord - 原始记录（如果是新增则为 null）
   * @param {Object} newRecord - 新记录（如果是删除则为 null）
   */
  processBalanceChange(oldRecord, newRecord) {
    let accountsData = wx.getStorageSync('accounts');
    if (!accountsData || !accountsData.accounts) return;

    let accounts = accountsData.accounts;
    let changed = false;

    // 1. 撤销旧记录的影响 (Restore)
    if (oldRecord && oldRecord.accountId) {
      let account = accounts.find(a => a.id == oldRecord.accountId);
      if (account) {
        // 逆向操作：收入则减，支出则加
        let revertAmount = oldRecord.type === '收入' ? -oldRecord.amount : oldRecord.amount;
        account.balance = parseFloat(account.balance) + revertAmount;
        changed = true;
      }
    }

    // 2. 应用新记录的影响 (Apply)
    if (newRecord && newRecord.accountId) {
      let account = accounts.find(a => a.id == newRecord.accountId);
      if (account) {
        // 正向操作：收入则加，支出则减
        let applyAmount = newRecord.type === '收入' ? newRecord.amount : -newRecord.amount;
        account.balance = parseFloat(account.balance) + applyAmount;
        changed = true;
      }
    }

    if (changed) {
      wx.setStorageSync('accounts', { accounts });
      return true;
    }
    return false;
  },

  /**
   * 重新加载所有账户并刷新页面（辅助方法）
   */
  refreshAllAccounts(pageInstance) {
    if (pageInstance && pageInstance.loadAccounts) {
      pageInstance.loadAccounts();
    }
  }
})