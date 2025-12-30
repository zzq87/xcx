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
    // 预设图标集合
    presetIcons: [
      '💵', '💳', '🐜', '💬', '🏦', '💰', '💸', '📱', 
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
    
    // 重置数据，确保有默认值
    accounts = {
      deposit: [
        { id: 1, name: '现金', balance: 100.50, icon: '💵' },
        { id: 2, name: '银行卡', balance: 2000.75, icon: '💳' },
        { id: 3, name: '支付宝', balance: 500.00, icon: '🐜' },
        { id: 4, name: '微信', balance: 888.88, icon: '💬' }
      ],
      liability: [
        { id: 5, name: '信用卡', balance: -1000.00, icon: '💳' },
        { id: 6, name: '花呗', balance: -500.50, icon: '🌸' }
      ]
    };
    
    // 强制保存到存储
    wx.setStorageSync('accounts', accounts);
    
    // 确保所有账户余额都是数字类型
    Object.keys(accounts).forEach(type => {
      accounts[type] = accounts[type].map(account => ({
        ...account,
        balance: parseFloat(account.balance) || 0
      }));
    });
    
    // 合并所有账户到一个数组
    const allAccounts = [...accounts.deposit, ...accounts.liability];
    
    // 直接计算总余额
    let total = 0;
    Object.keys(accounts).forEach(type => {
      accounts[type].forEach(account => {
        total += account.balance;
      });
    });
    
    // 强制更新所有数据
    this.setData({
      accounts: accounts,
      allAccounts: allAccounts,
      currentAccounts: accounts[this.data.activeTab || 'deposit'],
      totalBalance: total
    }, () => {
      // 调试：查看设置后的数据
      console.log('数据设置完成:', this.data);
    });
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab,
      currentAccounts: this.data.accounts[tab]
    });
  },

  // 显示转账对话框
  showTransferDialog() {
    // 更新所有账户列表
    const allAccounts = [...this.data.accounts.deposit, ...this.data.accounts.liability];
    
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
        if (account.id === transferForm.fromAccountId) {
          return { ...account, balance: newFromBalance };
        }
        if (account.id === transferForm.toAccountId) {
          return { ...account, balance: newToBalance };
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
    
    const record = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      fromAccountId: transferForm.fromAccountId,
      toAccountId: transferForm.toAccountId,
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
    
    // 验证初始余额
    const balance = parseFloat(newAccount.balance) || 0;
    if (newAccount.type === 'deposit' && balance < 0) {
      wx.showToast({
        title: '存款账户初始余额不能为负数',
        icon: 'none'
      });
      return;
    }
    if (newAccount.type === 'liability' && balance > 0) {
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
      icon: newAccount.icon
    };
    
    // 添加新账户
    accounts[newAccount.type].push(newAccountData);
    
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
        accountType = type;
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
    
    // 验证余额
    const balance = parseFloat(editAccount.balance) || 0;
    if (editAccount.type === 'deposit' && balance < 0) {
      wx.showToast({
        title: '存款账户余额不能为负数',
        icon: 'none'
      });
      return;
    }
    if (editAccount.type === 'liability' && balance > 0) {
      wx.showToast({
        title: '负债账户余额不能为正数',
        icon: 'none'
      });
      return;
    }
    
    // 更新账户数据
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