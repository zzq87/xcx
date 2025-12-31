// accounts.js
Page({
  data: {
    activeTab: 'deposit',
    accounts: {
      deposit: [],
      liability: []
    },
    allAccounts: [],
    currentAccounts: [],
    totalBalance: 0,
    showTransferDialog: false,
    transferForm: {
      fromAccountId: null,
      toAccountId: null,
      amount: '',
      note: ''
    },
    showAddAccountDialog: false,
    newAccount: {
      name: '',
      type: 'deposit',
      balance: 0,
      icon: '💵'
    },
    showEditAccountDialog: false,
    editAccount: {
      id: null,
      name: '',
      balance: 0,
      type: 'deposit',
      icon: '💵'
    },
    showDeleteConfirmDialog: false,
    accountToDelete: null,
    showAddSubAccountDialog: false,
    showEditSubAccountDialog: false,
    showDeleteSubAccountConfirmDialog: false,
    currentAccountId: null,
    currentSubAccountId: null,
    currentAccountType: '',
    newSubAccount: {
      name: '',
      balance: 0,
      icon: '💳'
    },
    editSubAccount: {
      id: null,
      name: '',
      balance: 0,
      icon: '💳'
    },
    // 预设图标集合
    presetIcons: [
      '💵', '💳', '蚂蚁', '💬', '🏦', '💰', '💸', '📱', 
      '💎', '🎁', '📈', '📉', '🏠', '🚗', '✈️', '🍔',
      '👔', '💊', '📚', '🎮', '🎨', '🏋️', '🎵', '📷',
      '🎒', '👶', '🐶', '🐱', '🌱', '🔥', '💧', '☀️'
    ]
  },

  onLoad() {
    this.loadAccounts();
  },

  onShow() {
    this.loadAccounts();
  },

  // 加载账户数据
  loadAccounts() {
    let accounts = wx.getStorageSync('accounts');
    
    // 如果没有账户数据，初始化默认账户
    if (!accounts) {
      accounts = {
        deposit: [
          { id: 1, name: '现金', balance: 0, icon: '💵' },
          { id: 2, name: '银行卡', balance: 0, icon: '💳' },
          { id: 3, name: '支付宝', balance: 0, icon: '蚂蚁' },
          { id: 4, name: '微信', balance: 0, icon: '💬' }
        ],
        liability: [
          { id: 5, name: '信用卡', balance: 0, icon: '💳', subAccounts: [] },
          { id: 6, name: '花呗', balance: 0, icon: '🌸' }
        ]
      };
      wx.setStorageSync('accounts', accounts);
    }
    
    // 确保账户类型正确（修复借给他人应为存款账户的问题）
    accounts = this.ensureAccountTypes(accounts);
    
    // 确保所有账户余额都是数字类型
    Object.keys(accounts).forEach(type => {
      accounts[type] = accounts[type].map(account => ({
        ...account,
        balance: parseFloat(account.balance) || 0,
        // 确保子账户数组存在
        subAccounts: account.subAccounts || []
      }));
    });
    
    // 合并所有账户到一个数组
    const allAccounts = [...accounts.deposit, ...accounts.liability];
    
    // 直接计算总余额
    let total = 0;
    Object.keys(accounts).forEach(type => {
      accounts[type].forEach(account => {
        total += account.balance;
        // 如果有子账户，也计入总余额
        if (account.subAccounts && Array.isArray(account.subAccounts)) {
          account.subAccounts.forEach(subAccount => {
            total += parseFloat(subAccount.balance) || 0;
          });
        }
      });
    });
    
    // 为子账户添加父账户信息，便于在WXML中访问
    const currentTab = this.data.activeTab || 'deposit';
    const currentAccounts = accounts[currentTab].map(account => {
      if (account.subAccounts && Array.isArray(account.subAccounts)) {
        // 为每个子账户添加父账户信息
        const subAccounts = account.subAccounts.map(subAccount => {
          return {
            ...subAccount,
            parentId: account.id,
            parentType: currentTab
          };
        });
        
        // 计算子账户总余额
        const subAccountsTotalBalance = subAccounts.reduce((total, subAccount) => {
          return total + (parseFloat(subAccount.balance) || 0);
        }, 0);
        
        return {
          ...account,
          subAccounts,
          subAccountsTotalBalance, // 子账户总余额
          // 如果没有expanded属性，初始化为false
          expanded: account.expanded !== undefined ? account.expanded : false
        };
      }
      return {
        ...account,
        subAccountsTotalBalance: account.balance, // 没有子账户时，子账户总余额为账户本身余额
        // 如果没有expanded属性，初始化为false
        expanded: account.expanded !== undefined ? account.expanded : false
      };
    });
    
    // 强制更新所有数据
    this.setData({
      accounts: accounts,
      allAccounts: allAccounts,
      currentAccounts: currentAccounts,
      totalBalance: total
    }, () => {
      // 调试：查看设置后的数据
      console.log('数据设置完成:', this.data);
    });
  },
  
  // 确保账户类型正确
  ensureAccountTypes(accounts) {
    // 检查是否存在“借给他人”在负债账户中，如果是则移动到存款账户
    const liabilityAccounts = accounts.liability || [];
    const depositAccounts = accounts.deposit || [];
    
    // 查找“借给他人”账户
    const borrowedIndex = liabilityAccounts.findIndex(acc => acc.name === '借给他人');
    if (borrowedIndex !== -1) {
      // 将“借给他人”从负债账户移到存款账户
      const borrowedAccount = liabilityAccounts.splice(borrowedIndex, 1)[0];
      depositAccounts.push(borrowedAccount);
    }
    
    // 查找“借用他人”账户是否在存款账户中，如果是则移动到负债账户
    const lentIndex = depositAccounts.findIndex(acc => acc.name === '借用他人');
    if (lentIndex !== -1) {
      // 将“借用他人”从存款账户移到负债账户
      const lentAccount = depositAccounts.splice(lentIndex, 1)[0];
      liabilityAccounts.push(lentAccount);
    }
    
    return {
      deposit: depositAccounts,
      liability: liabilityAccounts
    };
  },

  // 展开/收起子账户
  toggleSubaccounts(e) {
    const id = Number(e.currentTarget.dataset.id);
    const { activeTab, accounts } = this.data;
    
    // 找到对应的账户并切换expanded状态
    const updatedAccounts = accounts[activeTab].map(account => {
      if (account.id === id) {
        return { ...account, expanded: !account.expanded };
      }
      return account;
    });
    
    // 更新账户数据
    const newAccounts = {
      ...accounts,
      [activeTab]: updatedAccounts
    };
    
    this.setData({
      accounts: newAccounts,
      currentAccounts: updatedAccounts
    });
    
    // 保存到本地存储
    wx.setStorageSync('accounts', newAccounts);
  },
  
  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    
    // 为子账户添加父账户信息，便于在WXML中访问
    const accounts = this.data.accounts;
    const currentAccounts = accounts[tab].map(account => {
      if (account.subAccounts && Array.isArray(account.subAccounts)) {
        // 为每个子账户添加父账户信息
        const subAccounts = account.subAccounts.map(subAccount => {
          return {
            ...subAccount,
            parentId: account.id,
            parentType: tab
          };
        });
        
        // 计算子账户总余额
        const subAccountsTotalBalance = subAccounts.reduce((total, subAccount) => {
          return total + (parseFloat(subAccount.balance) || 0);
        }, 0);
        
        return {
          ...account,
          subAccounts,
          subAccountsTotalBalance, // 子账户总余额
          // 保留expanded状态，如果没有则初始化为false
          expanded: account.expanded !== undefined ? account.expanded : false
        };
      }
      return {
        ...account,
        subAccountsTotalBalance: account.balance, // 没有子账户时，子账户总余额为账户本身余额
        // 保留expanded状态，如果没有则初始化为false
        expanded: account.expanded !== undefined ? account.expanded : false
      };
    });
  
    this.setData({
      currentAccounts,
      activeTab: tab
    });
  },

  // 显示转账对话框
  showTransferDialog() {
    // 更新所有账户列表（包括子账户）
    let allAccounts = [...this.data.accounts.deposit, ...this.data.accounts.liability];
    
    // 将子账户也添加到账户列表中，以便转账时可以选择
    Object.keys(this.data.accounts).forEach(type => {
      this.data.accounts[type].forEach(account => {
        if (account.subAccounts && Array.isArray(account.subAccounts)) {
          account.subAccounts.forEach(subAccount => {
            // 为子账户添加额外信息用于转账
            allAccounts.push({
              ...subAccount,
              parentId: account.id,
              parentType: type,
              isSubAccount: true // 标记这是子账户
            });
          });
        }
      });
    });
    
    this.setData({
      allAccounts,
      showTransferDialog: true,
      transferForm: {
        fromAccountId: null,
        toAccountId: null,
        amount: '',
        note: ''
      }
    });
  },

  // 隐藏转账对话框
  hideTransferDialog() {
    this.setData({
      showTransferDialog: false
    });
  },

  // 显示添加账户对话框
  showAddAccountDialog() {
    this.setData({
      showAddAccountDialog: true,
      newAccount: {
        name: '',
        type: this.data.activeTab,
        balance: 0,
        icon: '💵'
      }
    });
  },

  // 隐藏添加账户对话框
  hideAddAccountDialog() {
    this.setData({
      showAddAccountDialog: false
    });
  },

  // 转账表单输入
  onTransferInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`transferForm.${field}`]: e.detail.value
    });
  },

  // 新账户表单输入
  onNewAccountInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`newAccount.${field}`]: e.detail.value
    });
  },

  // 选择转出账户
  selectFromAccount(e) {
    this.setData({
      'transferForm.fromAccountId': Number(e.currentTarget.dataset.id)
    });
  },

  // 选择转入账户
  selectToAccount(e) {
    this.setData({
      'transferForm.toAccountId': Number(e.currentTarget.dataset.id)
    });
  },

  // 执行转账
  executeTransfer() {
    const { transferForm, accounts } = this.data;
    
    if (!transferForm.fromAccountId || !transferForm.toAccountId) {
      wx.showToast({
        title: '请选择转出和转入账户',
        icon: 'none'
      });
      return;
    }
    
    if (transferForm.fromAccountId === transferForm.toAccountId) {
      wx.showToast({
        title: '转出和转入账户不能相同',
        icon: 'none'
      });
      return;
    }
    
    const amount = parseFloat(transferForm.amount);
    if (isNaN(amount) || amount <= 0) {
      wx.showToast({
        title: '请输入有效金额',
        icon: 'none'
      });
      return;
    }
    
    // 查找转出和转入账户及其类型
    let fromAccount = null;
    let toAccount = null;
    let fromAccountType = '';
    let toAccountType = '';
    let isFromSubAccount = false;
    let isToSubAccount = false;
    
    // 遍历所有账户类型查找账户
    Object.keys(accounts).forEach(type => {
      accounts[type].forEach(account => {
        if (account.id === transferForm.fromAccountId) {
          fromAccount = account;
          fromAccountType = type;
        }
        if (account.id === transferForm.toAccountId) {
          toAccount = account;
          toAccountType = type;
        }
        
        // 检查子账户
        if (account.subAccounts && Array.isArray(account.subAccounts)) {
          account.subAccounts.forEach(subAccount => {
            if (subAccount.id === transferForm.fromAccountId) {
              fromAccount = subAccount;
              fromAccountType = type;
              isFromSubAccount = true;
            }
            if (subAccount.id === transferForm.toAccountId) {
              toAccount = subAccount;
              toAccountType = type;
              isToSubAccount = true;
            }
          });
        }
      });
    });
    
    if (!fromAccount || !toAccount) {
      wx.showToast({
        title: '账户不存在',
        icon: 'none'
      });
      return;
    }
    
    // 验证转出账户余额
    const newFromBalance = (parseFloat(fromAccount.balance) || 0) - amount;
    if (fromAccountType === 'deposit' && newFromBalance < 0) {
      wx.showToast({
        title: '存款账户余额不能为负数',
        icon: 'none'
      });
      return;
    }
    
    // 验证转入账户余额
    const newToBalance = (parseFloat(toAccount.balance) || 0) + amount;
    if (toAccountType === 'liability' && newToBalance > 0) {
      wx.showToast({
        title: '负债账户余额不能为正数',
        icon: 'none'
      });
      return;
    }
    
    // 更新账户余额
    Object.keys(accounts).forEach(type => {
      accounts[type] = accounts[type].map(account => {
        // 更新主账户
        if (account.id === transferForm.fromAccountId) {
          return { ...account, balance: newFromBalance };
        }
        if (account.id === transferForm.toAccountId) {
          return { ...account, balance: newToBalance };
        }
        
        // 更新子账户
        if (account.subAccounts && Array.isArray(account.subAccounts)) {
          const updatedSubAccounts = account.subAccounts.map(subAccount => {
            if (isFromSubAccount && subAccount.id === transferForm.fromAccountId) {
              return { ...subAccount, balance: newFromBalance };
            }
            if (isToSubAccount && subAccount.id === transferForm.toAccountId) {
              return { ...subAccount, balance: newToBalance };
            }
            return subAccount;
          });
          return { ...account, subAccounts: updatedSubAccounts };
        }
        
        return account;
      });
    });
    
    // 保存更新后的账户数据
    wx.setStorageSync('accounts', accounts);
    
    // 保存转账记录
    this.saveTransferRecord(transferForm, amount);
    
    // 计算新的总余额
    let total = 0;
    Object.keys(accounts).forEach(type => {
      accounts[type].forEach(account => {
        total += (parseFloat(account.balance) || 0);
        // 如果有子账户，也计入总余额
        if (account.subAccounts && Array.isArray(account.subAccounts)) {
          account.subAccounts.forEach(subAccount => {
            total += parseFloat(subAccount.balance) || 0;
          });
        }
      });
    });
    
    // 更新页面数据
    this.setData({
      accounts,
      currentAccounts: accounts[this.data.activeTab],
      showTransferDialog: false,
      totalBalance: total
    });
    
    wx.showToast({
      title: '转账成功',
      icon: 'success'
    });
  },

  // 保存转账记录
  saveTransferRecord(transferForm, amount) {
    let transferRecords = wx.getStorageSync('transferRecords') || [];
    
    // 查找账户名称
    const accounts = wx.getStorageSync('accounts');
    let fromAccountName = '未知账户';
    let toAccountName = '未知账户';
    
    Object.keys(accounts).forEach(type => {
      accounts[type].forEach(account => {
        if (account.id === transferForm.fromAccountId) {
          fromAccountName = account.name;
        }
        if (account.id === transferForm.toAccountId) {
          toAccountName = account.name;
        }
        
        // 检查子账户
        if (account.subAccounts && Array.isArray(account.subAccounts)) {
          account.subAccounts.forEach(subAccount => {
            if (subAccount.id === transferForm.fromAccountId) {
              fromAccountName = `${account.name}-${subAccount.name}`;
            }
            if (subAccount.id === transferForm.toAccountId) {
              toAccountName = `${account.name}-${subAccount.name}`;
            }
          });
        }
      });
    });
    
    const record = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      fromAccountId: transferForm.fromAccountId,
      toAccountId: transferForm.toAccountId,
      fromAccountName: fromAccountName,
      toAccountName: toAccountName,
      amount: amount,
      note: transferForm.note
    };
    
    transferRecords.push(record);
    wx.setStorageSync('transferRecords', transferRecords);
  },

  // 设置账户类型
  setAccountType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      'newAccount.type': type
    });
  },

  // 选择图标
  selectIcon(e) {
    const icon = e.currentTarget.dataset.icon;
    const forWhich = e.currentTarget.dataset.for;
    
    if (forWhich === 'new') {
      this.setData({
        'newAccount.icon': icon
      });
    } else if (forWhich === 'edit') {
      this.setData({
        'editAccount.icon': icon
      });
    } else if (forWhich === 'newSub') {
      this.setData({
        'newSubAccount.icon': icon
      });
    } else if (forWhich === 'editSub') {
      this.setData({
        'editSubAccount.icon': icon
      });
    }
  },

  // 添加账户
  addAccount() {
    const { newAccount, accounts } = this.data;
    
    if (!newAccount.name.trim()) {
      wx.showToast({
        title: '请输入账户名称',
        icon: 'none'
      });
      return;
    }
    
    // 确保“借给他人”账户为存款账户类型
    let accountType = newAccount.name === '借给他人' ? 'deposit' : newAccount.type;
    
    // 验证初始余额
    const balance = parseFloat(newAccount.balance) || 0;
    if (accountType === 'deposit' && balance < 0) {
      wx.showToast({
        title: '存款账户初始余额不能为负数',
        icon: 'none'
      });
      return;
    }
    if (accountType === 'liability' && balance > 0) {
      wx.showToast({
        title: '负债账户初始余额不能为正数',
        icon: 'none'
      });
      return;
    }
    
    // 生成新账户ID
    let maxId = 0;
    Object.keys(accounts).forEach(type => {
      accounts[type].forEach(account => {
        if (account.id > maxId) {
          maxId = account.id;
        }
        // 检查子账户
        if (account.subAccounts && Array.isArray(account.subAccounts)) {
          account.subAccounts.forEach(subAccount => {
            if (subAccount.id > maxId) {
              maxId = subAccount.id;
            }
          });
        }
      });
    });
    
    const newAccountData = {
      id: maxId + 1,
      name: newAccount.name.trim(),
      balance: balance,
      icon: newAccount.icon,
      subAccounts: [] // 新建的主账户默认有空的子账户数组
    };
    
    // 添加新账户
    accounts[accountType].push(newAccountData);
    
    // 保存到本地存储
    wx.setStorageSync('accounts', accounts);
    
    // 计算新的总余额
    let total = 0;
    Object.keys(accounts).forEach(type => {
      accounts[type].forEach(account => {
        total += (parseFloat(account.balance) || 0);
        // 如果有子账户，也计入总余额
        if (account.subAccounts && Array.isArray(account.subAccounts)) {
          account.subAccounts.forEach(subAccount => {
            total += parseFloat(subAccount.balance) || 0;
          });
        }
      });
    });
    
    // 更新页面数据
    this.setData({
      accounts,
      currentAccounts: accounts[this.data.activeTab],
      showAddAccountDialog: false,
      totalBalance: total
    });
    
    wx.showToast({
      title: '添加成功',
      icon: 'success'
    });
  },
  
  // 显示添加子账户对话框
  showAddSubAccountDialog(e) {
    const accountId = Number(e.currentTarget.dataset.id);
    const accountType = e.currentTarget.dataset.type;
    
    this.setData({
      showAddSubAccountDialog: true,
      currentAccountId: accountId,
      currentAccountType: accountType,
      newSubAccount: {
        name: '',
        balance: 0,
        icon: '💳' // 默认使用信用卡图标
      }
    });
  },
  
  // 隐藏添加子账户对话框
  hideAddSubAccountDialog() {
    this.setData({
      showAddSubAccountDialog: false
    });
  },
  
  // 添加子账户
  addSubAccount() {
    const { newSubAccount, currentAccountId, currentAccountType, accounts } = this.data;
    
    if (!newSubAccount.name.trim()) {
      wx.showToast({
        title: '请输入子账户名称',
        icon: 'none'
      });
      return;
    }
    
    // 验证初始余额
    const balance = parseFloat(newSubAccount.balance) || 0;
    
    // 生成新子账户ID
    let maxId = 0;
    Object.keys(accounts).forEach(type => {
      accounts[type].forEach(account => {
        if (account.id > maxId) {
          maxId = account.id;
        }
        // 检查子账户
        if (account.subAccounts && Array.isArray(account.subAccounts)) {
          account.subAccounts.forEach(subAccount => {
            if (subAccount.id > maxId) {
              maxId = subAccount.id;
            }
          });
        }
      });
    });
    
    const newSubAccountData = {
      id: maxId + 1,
      name: newSubAccount.name.trim(),
      balance: balance,
      icon: newSubAccount.icon
    };
    
    // 找到对应的主账户并添加子账户
    const accountIndex = accounts[currentAccountType].findIndex(acc => acc.id === currentAccountId);
    if (accountIndex !== -1) {
      accounts[currentAccountType][accountIndex].subAccounts.push(newSubAccountData);
      // 确保账户是展开状态
      accounts[currentAccountType][accountIndex].expanded = true;
    }
    
    // 保存到本地存储
    wx.setStorageSync('accounts', accounts);
    
    // 计算新的总余额
    let total = 0;
    Object.keys(accounts).forEach(type => {
      accounts[type].forEach(account => {
        total += (parseFloat(account.balance) || 0);
        // 如果有子账户，也计入总余额
        if (account.subAccounts && Array.isArray(account.subAccounts)) {
          account.subAccounts.forEach(subAccount => {
            total += parseFloat(subAccount.balance) || 0;
          });
        }
      });
    });
    
    // 重新计算当前账户列表，包括子账户总余额
    const currentTab = this.data.activeTab;
    const currentAccounts = accounts[currentTab].map(account => {
      if (account.subAccounts && Array.isArray(account.subAccounts)) {
        // 为每个子账户添加父账户信息
        const subAccounts = account.subAccounts.map(subAccount => {
          return {
            ...subAccount,
            parentId: account.id,
            parentType: currentTab
          };
        });
        
        // 计算子账户总余额
        const subAccountsTotalBalance = subAccounts.reduce((total, subAccount) => {
          return total + (parseFloat(subAccount.balance) || 0);
        }, 0);
        
        return {
          ...account,
          subAccounts,
          subAccountsTotalBalance, // 子账户总余额
          // 保留expanded状态，如果没有则初始化为false
          expanded: account.expanded !== undefined ? account.expanded : false
        };
      }
      return {
        ...account,
        subAccountsTotalBalance: 0, // 没有子账户时，子账户总余额为0
        // 保留expanded状态，如果没有则初始化为false
        expanded: account.expanded !== undefined ? account.expanded : false
      };
    });
    
    // 更新页面数据
    this.setData({
      accounts,
      currentAccounts: currentAccounts,
      showAddSubAccountDialog: false,
      totalBalance: total
    });
    
    wx.showToast({
      title: '添加子账户成功',
      icon: 'success'
    });
  },
  
  // 输入子账户表单
  onNewSubAccountInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`newSubAccount.${field}`]: e.detail.value
    });
  },
  
  // 显示编辑子账户对话框
  showEditSubAccountDialog(e) {
    const accountId = Number(e.currentTarget.dataset.accountid);
    const subAccountId = Number(e.currentTarget.dataset.subid);
    const accountType = e.currentTarget.dataset.type;
    
    const { accounts } = this.data;
    
    // 查找对应的主账户和子账户
    const accountIndex = accounts[accountType].findIndex(acc => acc.id === accountId);
    if (accountIndex === -1) return;
    
    const account = accounts[accountType][accountIndex];
    const subAccountIndex = account.subAccounts.findIndex(sub => sub.id === subAccountId);
    if (subAccountIndex === -1) return;
    
    const subAccount = account.subAccounts[subAccountIndex];
    
    this.setData({
      showEditSubAccountDialog: true,
      currentAccountId: accountId,
      currentSubAccountId: subAccountId,
      currentAccountType: accountType,
      editSubAccount: {
        ...subAccount,
        balance: subAccount.balance.toFixed(2)
      }
    });
  },
  
  // 编辑子账户表单输入
  onEditSubAccountInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`editSubAccount.${field}`]: e.detail.value
    });
  },
  
  // 保存编辑子账户
  saveEditSubAccount() {
    const { editSubAccount, currentAccountId, currentSubAccountId, currentAccountType, accounts } = this.data;
    
    if (!editSubAccount.name.trim()) {
      wx.showToast({
        title: '请输入子账户名称',
        icon: 'none'
      });
      return;
    }
    
    // 验证余额
    const balance = parseFloat(editSubAccount.balance) || 0;
    
    // 找到对应的主账户和子账户并更新
    const accountIndex = accounts[currentAccountType].findIndex(acc => acc.id === currentAccountId);
    if (accountIndex === -1) return;
    
    const subAccountIndex = accounts[currentAccountType][accountIndex].subAccounts.findIndex(sub => sub.id === currentSubAccountId);
    if (subAccountIndex === -1) return;
    
    // 更新子账户信息
    accounts[currentAccountType][accountIndex].subAccounts[subAccountIndex] = {
      ...editSubAccount,
      name: editSubAccount.name.trim(),
      balance: balance
    };
    
    // 保存到本地存储
    wx.setStorageSync('accounts', accounts);
    
    // 计算新的总余额
    let total = 0;
    Object.keys(accounts).forEach(type => {
      accounts[type].forEach(account => {
        total += (parseFloat(account.balance) || 0);
        // 如果有子账户，也计入总余额
        if (account.subAccounts && Array.isArray(account.subAccounts)) {
          account.subAccounts.forEach(subAccount => {
            total += parseFloat(subAccount.balance) || 0;
          });
        }
      });
    });
    
    // 重新计算当前账户列表，包括子账户总余额
    const currentTab = this.data.activeTab;
    const currentAccounts = accounts[currentTab].map(account => {
      if (account.subAccounts && Array.isArray(account.subAccounts)) {
        // 为每个子账户添加父账户信息
        const subAccounts = account.subAccounts.map(subAccount => {
          return {
            ...subAccount,
            parentId: account.id,
            parentType: currentTab
          };
        });
        
        // 计算子账户总余额
        const subAccountsTotalBalance = subAccounts.reduce((total, subAccount) => {
          return total + (parseFloat(subAccount.balance) || 0);
        }, 0);
        
        return {
          ...account,
          subAccounts,
          subAccountsTotalBalance, // 子账户总余额
          // 保留expanded状态，如果没有则初始化为false
          expanded: account.expanded !== undefined ? account.expanded : false
        };
      }
      return {
        ...account,
        subAccountsTotalBalance: account.balance, // 没有子账户时，子账户总余额为账户本身余额
        // 保留expanded状态，如果没有则初始化为false
        expanded: account.expanded !== undefined ? account.expanded : false
      };
    });
    
    // 更新页面数据
    this.setData({
      accounts,
      currentAccounts: currentAccounts,
      showEditSubAccountDialog: false,
      totalBalance: total
    });
    
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
  },

  // 隐藏编辑子账户对话框
  hideEditSubAccountDialog() {
    this.setData({
      showEditSubAccountDialog: false
    });
  },
  
  // 显示删除子账户确认对话框
  showDeleteSubAccountConfirmDialog(e) {
    const accountId = Number(e.currentTarget.dataset.accountid);
    const subAccountId = Number(e.currentTarget.dataset.subid);
    const accountType = e.currentTarget.dataset.type;
    
    this.setData({
      showDeleteSubAccountConfirmDialog: true,
      accountToDelete: { accountId, subAccountId, accountType }
    });
  },
  
  // 隐藏删除子账户确认对话框
  hideDeleteSubAccountConfirmDialog() {
    this.setData({
      showDeleteSubAccountConfirmDialog: false,
      accountToDelete: null
    });
  },
  
  // 删除子账户
  deleteSubAccount() {
    const { accountToDelete, accounts } = this.data;
    
    if (!accountToDelete) return;
    
    const { accountId, subAccountId, accountType } = accountToDelete;
    
    // 找到对应的主账户并删除子账户
    const accountIndex = accounts[accountType].findIndex(acc => acc.id === accountId);
    if (accountIndex === -1) return;
    
    const subAccountIndex = accounts[accountType][accountIndex].subAccounts.findIndex(sub => sub.id === subAccountId);
    if (subAccountIndex === -1) return;
    
    accounts[accountType][accountIndex].subAccounts.splice(subAccountIndex, 1);
    
    // 保存到本地存储
    wx.setStorageSync('accounts', accounts);
    
    // 计算新的总余额
    let total = 0;
    Object.keys(accounts).forEach(type => {
      accounts[type].forEach(account => {
        total += (parseFloat(account.balance) || 0);
        // 如果有子账户，也计入总余额
        if (account.subAccounts && Array.isArray(account.subAccounts)) {
          account.subAccounts.forEach(subAccount => {
            total += parseFloat(subAccount.balance) || 0;
          });
        }
      });
    });
    
    // 重新计算当前账户列表，包括子账户总余额
    const currentTab = this.data.activeTab;
    const currentAccounts = accounts[currentTab].map(account => {
      if (account.subAccounts && Array.isArray(account.subAccounts)) {
        // 为每个子账户添加父账户信息
        const subAccounts = account.subAccounts.map(subAccount => {
          return {
            ...subAccount,
            parentId: account.id,
            parentType: currentTab
          };
        });
        
        // 计算子账户总余额
        const subAccountsTotalBalance = subAccounts.reduce((total, subAccount) => {
          return total + (parseFloat(subAccount.balance) || 0);
        }, 0);
        
        return {
          ...account,
          subAccounts,
          subAccountsTotalBalance, // 子账户总余额
          // 保留expanded状态，如果没有则初始化为false
          expanded: account.expanded !== undefined ? account.expanded : false
        };
      }
      return {
        ...account,
        subAccountsTotalBalance: account.balance, // 没有子账户时，子账户总余额为账户本身余额
        // 保留expanded状态，如果没有则初始化为false
        expanded: account.expanded !== undefined ? account.expanded : false
      };
    });
    
    // 更新页面数据
    this.setData({
      accounts,
      currentAccounts,
      showDeleteSubAccountConfirmDialog: false,
      accountToDelete: null,
      totalBalance: total
    });
    
    wx.showToast({
      title: '删除成功',
      icon: 'success'
    });
  },

  // 显示编辑账户对话框
  showEditAccountDialog(e) {
    const id = Number(e.currentTarget.dataset.id);
    const { accounts } = this.data;
    
    // 查找要编辑的账户
    let editAccount = null;
    let accountType = 'deposit';
    
    // 遍历所有账户类型查找账户
    Object.keys(accounts).forEach(type => {
      const account = accounts[type].find(acc => acc.id === id);
      if (account) {
        editAccount = account;
        // 如果是“借给他人”账户，确保其类型为存款账户
        accountType = account.name === '借给他人' ? 'deposit' : type;
      }
    });
    
    if (!editAccount) {
      wx.showToast({
        title: '账户不存在',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      showEditAccountDialog: true,
      editAccount: {
        ...editAccount,
        type: accountType,
        balance: editAccount.balance.toFixed(2) // 将余额转换为带两位小数的字符串，确保输入框正确显示
      }
    });
  },

  // 隐藏编辑账户对话框
  hideEditAccountDialog() {
    this.setData({
      showEditAccountDialog: false
    });
  },

  // 显示删除确认对话框
  showDeleteConfirmDialog(e) {
    const id = Number(e.currentTarget.dataset.id);
    this.setData({
      showDeleteConfirmDialog: true,
      accountToDelete: id
    });
  },

  // 隐藏删除确认对话框
  hideDeleteConfirmDialog() {
    this.setData({
      showDeleteConfirmDialog: false,
      accountToDelete: null
    });
  },

  // 编辑账户表单输入
  onEditAccountInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`editAccount.${field}`]: e.detail.value
    });
  },

  // 保存编辑后的账户
  saveEditAccount() {
    const { editAccount, accounts } = this.data;
    
    if (!editAccount.name.trim()) {
      wx.showToast({
        title: '请输入账户名称',
        icon: 'none'
      });
      return;
    }
    
    // 确保“借给他人”账户为存款账户类型
    let accountType = editAccount.name === '借给他人' ? 'deposit' : editAccount.type;
    
    // 验证余额
    const balance = parseFloat(editAccount.balance) || 0;
    if (accountType === 'deposit' && balance < 0) {
      wx.showToast({
        title: '存款账户余额不能为负数',
        icon: 'none'
      });
      return;
    }
    if (accountType === 'liability' && balance > 0) {
      wx.showToast({
        title: '负债账户余额不能为正数',
        icon: 'none'
      });
      return;
    }
    
    // 如果账户类型发生变化，需要从旧类型账户列表中移除，并添加到新类型账户列表中
    if (editAccount.type !== accountType) {
      // 从旧类型账户列表中移除
      accounts[editAccount.type] = accounts[editAccount.type].filter(account => account.id !== editAccount.id);
      
      // 添加到新类型账户列表
      const updatedAccount = {
        ...editAccount,
        name: editAccount.name.trim(),
        balance: balance
      };
      accounts[accountType].push(updatedAccount);
    } else {
      // 账户类型未变化，仅更新账户信息
      accounts[editAccount.type] = accounts[editAccount.type].map(account => {
        if (account.id === editAccount.id) {
          return {
            ...account,
            name: editAccount.name.trim(),
            balance: balance
          };
        }
        return account;
      });
    }
    
    // 保存到本地存储
    wx.setStorageSync('accounts', accounts);
    
    // 计算新的总余额
    let total = 0;
    Object.keys(accounts).forEach(type => {
      accounts[type].forEach(account => {
        total += (parseFloat(account.balance) || 0);
      });
    });
    
    // 重新计算当前账户列表，包括子账户总余额
    const currentTab = this.data.activeTab;
    const currentAccounts = accounts[currentTab].map(account => {
      if (account.subAccounts && Array.isArray(account.subAccounts)) {
        // 为每个子账户添加父账户信息
        const subAccounts = account.subAccounts.map(subAccount => {
          return {
            ...subAccount,
            parentId: account.id,
            parentType: currentTab
          };
        });
        
        // 计算子账户总余额
        const subAccountsTotalBalance = subAccounts.reduce((total, subAccount) => {
          return total + (parseFloat(subAccount.balance) || 0);
        }, 0);
        
        return {
          ...account,
          subAccounts,
          subAccountsTotalBalance, // 子账户总余额
          // 保留expanded状态，如果没有则初始化为false
          expanded: account.expanded !== undefined ? account.expanded : false
        };
      }
      return {
        ...account,
        subAccountsTotalBalance: 0, // 没有子账户时，子账户总余额为0
        // 保留expanded状态，如果没有则初始化为false
        expanded: account.expanded !== undefined ? account.expanded : false
      };
    });
    
    // 更新页面数据
    this.setData({
      accounts,
      currentAccounts: currentAccounts,
      showEditAccountDialog: false,
      totalBalance: total
    });
    
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
  },

  // 删除账户
  deleteAccount() {
    const { accounts, accountToDelete } = this.data;
    
    // 遍历所有账户类型，删除指定账户
    Object.keys(accounts).forEach(type => {
      accounts[type] = accounts[type].filter(account => account.id !== accountToDelete);
    });
    
    // 保存到本地存储
    wx.setStorageSync('accounts', accounts);
    
    // 计算新的总余额
    let total = 0;
    Object.keys(accounts).forEach(type => {
      accounts[type].forEach(account => {
        total += (parseFloat(account.balance) || 0);
      });
    });
    
    // 更新页面数据
    this.setData({
      accounts,
      currentAccounts: accounts[this.data.activeTab],
      showDeleteConfirmDialog: false,
      accountToDelete: null,
      totalBalance: total
    });
    
    wx.showToast({
      title: '删除成功',
      icon: 'success'
    });
  }
});