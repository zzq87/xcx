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
      icon: '💴',
      category: '现金账户' // 默认分类
    },
    showEditAccountDialog: false,
    editAccount: {
      id: null,
      name: '',
      balance: 0,
      type: 'deposit',
      icon: '💴',
      category: '现金账户' // 默认分类
    },
    showDeleteConfirmDialog: false,
    accountToDelete: null,
    // 预设图标集合（统一emoji图标风格）
    presetIcons: [
      '💴', '💳', '🐜', '💬', '🏦', '💰', '💸', '📱', 
      '💎', '🎁', '📈', '📉', '🏠', '🚗', '✈️', '🍴',
      '👔', '💊', '📖', '🎬', '🎨', '🏋️', '🎵', '📷',
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
    
    // 定义新的账户分类结构
    const accountCategories = {
      '现金账户': ['现金'],
      '虚拟账户': ['支付宝','微信钱包'],
      '储蓄账户': ['银行卡'],
      '投资账户': ['基金账户','股票账户'],
      '债权账户': ['应收款项','借给他人'],
      '信用账户': ['信用卡','蚂蚁花呗'],
      '负债账户': ['借用他人','应付款项']
    };
    
    // 如果没有账户数据，初始化默认账户
    if (!accounts) {
      // 默认账户数据（统一emoji图标风格）
      const defaultAccounts = [
        { id: 1, name: '现金', balance: 0, icon: '💴', category: '现金账户' },
        { id: 2, name: '银行卡', balance: 0, icon: '💳', category: '储蓄账户' },
        { id: 3, name: '支付宝', balance: 0, icon: '🐜', category: '虚拟账户' },
        { id: 4, name: '微信钱包', balance: 0, icon: '💬', category: '虚拟账户' },
        { id: 5, name: '信用卡', balance: 0, icon: '💳', category: '信用账户' },
        { id: 6, name: '蚂蚁花呗', balance: 0, icon: '🌸', category: '信用账户' },
        { id: 7, name: '借给他人', balance: 0, icon: '👤', category: '债权账户' },
        { id: 8, name: '借用他人', balance: 0, icon: '🤝', category: '负债账户' },
        { id: 9, name: '基金账户', balance: 0, icon: '📈', category: '投资账户' },
        { id: 10, name: '股票账户', balance: 0, icon: '📊', category: '投资账户' },
        { id: 11, name: '应收款项', balance: 0, icon: '📝', category: '债权账户' },
        { id: 12, name: '应付款项', balance: 0, icon: '📋', category: '负债账户' }
      ];
      
      accounts = { accounts: defaultAccounts };
      wx.setStorageSync('accounts', accounts);
    }
    
    // 如果是旧数据结构，转换为新结构
    if (accounts.deposit || accounts.liability) {
      // 旧数据结构，转换为新结构
      const allAccounts = [];
      let id = 1;
      
      // 将旧数据转换为新结构
      if (accounts.deposit) {
        accounts.deposit.forEach(account => {
          // 确定账户分类
          let category = '现金账户';
          if (account.name === '银行卡') {
            category = '储蓄账户';
          } else if (account.name === '支付宝' || account.name === '微信') {
            category = '虚拟账户';
          } else if (account.name === '借给他人') {
            category = '债权账户';
          }
          
          allAccounts.push({
            id: id++,
            name: account.name === '微信' ? '微信钱包' : account.name,
            balance: parseFloat(account.balance) || 0,
            icon: account.icon || '💴',
            category: category
          });
        });
      }
      
      if (accounts.liability) {
        accounts.liability.forEach(account => {
          // 确定账户分类
          let category = '负债账户';
          if (account.name === '信用卡' || account.name === '花呗') {
            category = '信用账户';
          } else if (account.name === '借用他人') {
            category = '负债账户';
          }
          
          allAccounts.push({
            id: id++,
            name: account.name === '花呗' ? '蚂蚁花呗' : account.name,
            balance: parseFloat(account.balance) || 0,
            icon: account.icon || '💳',
            category: category
          });
        });
      }
      
      // 添加缺少的默认账户
      const existingAccountNames = allAccounts.map(acc => acc.name);
      const defaultAccounts = [
        { id: id++, name: '基金账户', balance: 0, icon: '📈', category: '投资账户' },
        { id: id++, name: '股票账户', balance: 0, icon: '📊', category: '投资账户' },
        { id: id++, name: '应收款项', balance: 0, icon: '📝', category: '债权账户' },
        { id: id++, name: '应付款项', balance: 0, icon: '📋', category: '负债账户' }
      ];
      
      defaultAccounts.forEach(acc => {
        if (!existingAccountNames.includes(acc.name)) {
          allAccounts.push(acc);
        }
      });
      
      accounts = { accounts: allAccounts };
      wx.setStorageSync('accounts', accounts);
    }
    
    // 确保所有账户余额都是数字类型
    const allAccounts = accounts.accounts.map(account => ({
      ...account,
      balance: parseFloat(account.balance) || 0,
      icon: account.icon || '💴',
      category: account.category || '现金账户'
    }));
    
    // 按类型重新组织账户
    const accountsByType = {
      deposit: allAccounts.filter(acc => ['现金账户', '储蓄账户', '虚拟账户', '投资账户', '债权账户'].includes(acc.category)),
      liability: allAccounts.filter(acc => ['信用账户', '负债账户'].includes(acc.category))
    };
    
    // 直接计算总余额
    const total = allAccounts.reduce((sum, account) => sum + account.balance, 0);
    
    // 强制更新所有数据
    this.setData({
      accounts: accountsByType,
      allAccounts: allAccounts,
      currentAccounts: accountsByType[this.data.activeTab || 'deposit'],
      totalBalance: total
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
  
  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    
    this.setData({
      currentAccounts: this.data.accounts[tab],
      activeTab: tab
    });
  },

  // 显示转账对话框
  showTransferDialog() {
    // 更新所有账户列表
    let allAccounts = [...this.data.accounts.deposit, ...this.data.accounts.liability];
    
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
        icon: '💵',
        category: '现金账户' // 默认分类
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
        return account;
      });
    });
    
    // 保存更新后的账户数据，转换为统一的数据结构
    const allAccounts = [...accounts.deposit, ...accounts.liability];
    wx.setStorageSync('accounts', { accounts: allAccounts });
    
    // 保存转账记录
    this.saveTransferRecord(transferForm, amount);
    
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
    
    // 遍历所有账户查找名称
    accounts.accounts.forEach(account => {
      if (account.id === transferForm.fromAccountId) {
        fromAccountName = account.name;
      }
      if (account.id === transferForm.toAccountId) {
        toAccountName = account.name;
      }
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
      });
    });
    
    const newAccountData = {
      id: maxId + 1,
      name: newAccount.name.trim(),
      balance: balance,
      icon: newAccount.icon,
      category: newAccount.category || '现金账户' // 添加账户分类
    };
    
    // 添加新账户
    accounts[accountType].push(newAccountData);
    
    // 保存到本地存储，转换为统一的数据结构
    const allAccounts = [...accounts.deposit, ...accounts.liability];
    wx.setStorageSync('accounts', { accounts: allAccounts });
    
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
      showAddAccountDialog: false,
      totalBalance: total
    });
    
    wx.showToast({
      title: '添加成功',
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
    
    // 保存到本地存储，转换为统一的数据结构
    const allAccounts = [...accounts.deposit, ...accounts.liability];
    wx.setStorageSync('accounts', { accounts: allAccounts });
    
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
    
    // 保存到本地存储，转换为统一的数据结构
    const allAccounts = [...accounts.deposit, ...accounts.liability];
    wx.setStorageSync('accounts', { accounts: allAccounts });
    
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