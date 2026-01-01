// index.js
Page({
  data: {
    currentDate: '',
    currentTime: '',
    amount: '',
    focusAmount: false,
    types: ['支出', '收入'],
    typeIndex: 0,
    categories: [],
    categoryIndex: 0,
    subcategories: [],
    subcategoryIndex: 0,
    selectedCategoryId: null,
    selectedSubcategoryId: null,
    note: '',
    todayRecords: [],
    accounts: [],
    allAccounts: [],
    selectedAccountId: null,
    // 编辑记录相关
    showEditRecordDialog: false,
    editRecord: null,
    originalRecord: null
  },

  onLoad() {
    this.initCurrentDate();
    this.loadCategories();
    this.loadAccounts();
    this.loadTodayRecords();
  },

  // 初始化当前日期和时间
  initCurrentDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    this.setData({
      currentDate: `${year}-${month}-${day}`,
      currentTime: `${hours}:${minutes}`
    });
  },

  // 加载分类数据
  loadCategories() {
    let categories = wx.getStorageSync('categories');
    const type = this.data.types[this.data.typeIndex];
    const categoryType = type === '收入' ? 'income' : 'expense';
    
    let typeCategories = [];
    let categoryData = [];
    
    // 确保分类数据格式正确，包含subcategories和icon属性
    if (categories) {
      // 确保旧数据兼容，为每个分类添加subcategories和icon属性
      categories.income = categories.income.map(cat => {
        return { 
          ...cat, 
          subcategories: (cat.subcategories || []).map(subcat => ({
            ...subcat,
            icon: subcat.icon || '📌'
          })),
          icon: cat.icon || '💰'
        };
      });
      categories.expense = categories.expense.map(cat => {
        return { 
          ...cat, 
          subcategories: (cat.subcategories || []).map(subcat => ({
            ...subcat,
            icon: subcat.icon || '📌'
          })),
          icon: cat.icon || '💸'
        };
      });
      // 保存更新后的数据
      wx.setStorageSync('categories', categories);
      
      typeCategories = categories[categoryType].map(cat => cat.name);
      categoryData = categories[categoryType];
    } else {
      // 默认分类
      const defaultCategories = {
        income: [
          { id: 1, name: '工资', subcategories: [], icon: '💰' },
          { id: 2, name: '奖金', subcategories: [], icon: '🎁' },
          { id: 3, name: '其他收入', subcategories: [], icon: '📈' }
        ],
        expense: [
          { id: 4, name: '餐饮', subcategories: [
            { id: 11, name: '早餐', icon: '🍞' },
            { id: 12, name: '午餐', icon: '🍱' },
            { id: 13, name: '晚餐', icon: '🍜' },
            { id: 14, name: '水果', icon: '🍎' },
            { id: 15, name: '零食', icon: '🍪' },
            { id: 16, name: '饮料', icon: '🥤' }
          ], icon: '🍽️' },
          { id: 5, name: '交通', subcategories: [], icon: '🚗' },
          { id: 6, name: '购物', subcategories: [], icon: '🛍️' },
          { id: 7, name: '娱乐', subcategories: [], icon: '🎮' },
          { id: 8, name: '医疗', subcategories: [], icon: '🏥' },
          { id: 9, name: '教育', subcategories: [], icon: '📚' },
          { id: 10, name: '其他支出', subcategories: [], icon: '💸' }
        ]
      };
      
      // 保存默认数据到本地存储
      wx.setStorageSync('categories', defaultCategories);
      
      // 更新categories变量
      categories = defaultCategories;
      
      // 设置当前类型的分类数据
      typeCategories = categories[categoryType].map(cat => cat.name);
      categoryData = categories[categoryType];
    }
    
    // 构建包含图标的分类数组
    const categoriesWithIcons = categories[categoryType].map(cat => `${cat.icon} ${cat.name}`);
    
    this.setData({
      categories: categoriesWithIcons,
      categoryIndex: 0,
      categoryData
    });
    
    // 加载第一个分类的子分类
    this.loadSubcategories(0);
  },

  // 加载子分类数据
  loadSubcategories(categoryIndex) {
    const category = this.data.categoryData[categoryIndex];
    const subcategories = category ? category.subcategories.map(subcat => `${subcat.icon} ${subcat.name}`) : [];
    
    this.setData({
      subcategories,
      subcategoryIndex: 0,
      selectedCategoryId: category ? category.id : null,
      selectedSubcategoryId: category && category.subcategories.length > 0 ? category.subcategories[0].id : null
    });
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
      // 默认账户数据
      const defaultAccounts = [
        { id: 1, name: '现金', balance: 0, icon: '💵', category: '现金账户' },
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
    
    // 确保账户数据结构正确
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
            icon: account.icon || '💵',
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
    
    // 确保所有账户都有category字段
    const allAccounts = accounts.accounts.map(account => ({
      ...account,
      balance: parseFloat(account.balance) || 0,
      icon: account.icon || '💵'
    }));
    
    // 按分类组织账户
    const categorizedAccounts = {};
    // 将账户分类键转换为数组，确保显示顺序正确
    const accountCategoryList = Object.keys(accountCategories);
    accountCategoryList.forEach(category => {
      categorizedAccounts[category] = allAccounts.filter(acc => acc.category === category);
    });
    
    this.setData({
      allAccounts,
      categorizedAccounts,
      accountCategories: accountCategoryList
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

  // 选择分类
  selectCategory(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      categoryIndex: index
    });
    // 加载所选分类的子分类
    this.loadSubcategories(index);
  },

  // 选择子分类
  selectSubcategory(e) {
    const index = e.currentTarget.dataset.index;
    const subcategoryId = e.currentTarget.dataset.id;
    this.setData({
      subcategoryIndex: index,
      selectedSubcategoryId: subcategoryId
    });
  },
  
  // 选择账户
  selectAccount(e) {
    const accountId = e.currentTarget.dataset.id;
    this.setData({
      selectedAccountId: accountId
    });
  },

  // 金额输入事件
  onAmountInput(e) {
    this.setData({
      amount: e.detail.value
    });
  },

  // 日期选择事件
  onDateChange(e) {
    this.setData({
      currentDate: e.detail.value
    });
  },

  // 时间选择事件
  onTimeChange(e) {
    this.setData({
      currentTime: e.detail.value
    });
  },

  // 类型选择事件
  onTypeChange(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      typeIndex: parseInt(index)
    });
    // 切换类型后重新加载分类
    this.loadCategories();
  },

  // 分类选择事件
  onCategoryChange(e) {
    const categoryIndex = e.detail.value;
    this.setData({
      categoryIndex
    });
    // 加载所选分类的子分类
    this.loadSubcategories(categoryIndex);
  },

  // 子分类选择事件
  onSubcategoryChange(e) {
    this.setData({
      subcategoryIndex: e.detail.value
    });
  },

  // 备注输入事件
  onNoteInput(e) {
    this.setData({
      note: e.detail.value
    });
  },

  // 添加记录
  addRecord() {
    if (!this.data.amount) {
      wx.showToast({
        title: '请输入金额',
        icon: 'none'
      });
      return;
    }

    if (this.data.selectedAccountId === null) {
      wx.showToast({
        title: '请选择账户',
        icon: 'none'
      });
      return;
    }

    // 提取分类名称
    const category = this.data.categoryData[this.data.categoryIndex].name;
    
    // 提取子分类名称
    const categoryData = this.data.categoryData[this.data.categoryIndex];
    const subcategory = categoryData.subcategories.length > 0 ? categoryData.subcategories[this.data.subcategoryIndex].name : '';
    
    const record = {
      id: Date.now(),
      date: this.data.currentDate,
      time: this.data.currentTime, // 使用选择的时间，而不是实时时间
      amount: parseFloat(this.data.amount),
      type: this.data.types[this.data.typeIndex],
      category: category,
      subcategory: subcategory,
      note: this.data.note,
      accountId: this.data.selectedAccountId
    };

    // 更新账户余额并验证
    const balanceUpdated = this.updateAccountBalance(record);
    
    // 只有余额更新成功才保存记录
    if (balanceUpdated) {
      // 保存到本地存储
      this.saveRecord(record);
      
      // 刷新今日记录
      this.loadTodayRecords();
      
      // 清空表单
      this.setData({
        amount: '',
        typeIndex: 0,
        categoryIndex: 0,
        note: '',
        selectedAccountId: null
      });
      // 重新加载分类数据，确保与当前类型一致
      this.loadCategories();

      wx.showToast({
        title: '添加成功',
        icon: 'success'
      });
    }
  },

  // 保存记录到本地存储
  saveRecord(record) {
    const records = wx.getStorageSync('records') || [];
    records.push(record);
    wx.setStorageSync('records', records);
  },
  
  // 更新账户余额
  updateAccountBalance(record) {
    let accounts = wx.getStorageSync('accounts');
    if (!accounts) {
      return;
    }
    
    const amount = record.amount;
    const isIncome = record.type === '收入';
    const accountId = record.accountId;
    
    // 查找账户
    let account = null;
    let accountIndex = -1;
    let isNewStructure = false;
    
    if (accounts.accounts) {
      // 新数据结构：{ accounts: [...] }
      isNewStructure = true;
      accountIndex = accounts.accounts.findIndex(acc => acc.id === accountId);
      if (accountIndex !== -1) {
        account = accounts.accounts[accountIndex];
      }
    } else if (accounts.deposit && accounts.liability) {
      // 旧数据结构：{ deposit: [...], liability: [...] }
      let found = false;
      Object.keys(accounts).forEach(type => {
        if (found) return;
        const foundAccount = accounts[type].find(acc => acc.id === accountId);
        if (foundAccount) {
          account = foundAccount;
          found = true;
        }
      });
    }
    
    if (!account) {
      return;
    }
    
    // 计算新余额
    let newBalance = account.balance;
    if (isIncome) {
      // 收入：增加余额
      newBalance += amount;
    } else {
      // 支出：减少余额
      newBalance -= amount;
    }
    
    // 更新账户余额
    if (isNewStructure) {
      // 新数据结构更新
      accounts.accounts[accountIndex] = { ...account, balance: newBalance };
    } else {
      // 旧数据结构更新
      Object.keys(accounts).forEach(type => {
        accounts[type] = accounts[type].map(acc => {
          if (acc.id === accountId) {
            return { ...acc, balance: newBalance };
          }
          return acc;
        });
      });
    }
    
    // 保存更新后的账户数据
    wx.setStorageSync('accounts', accounts);
    
    // 更新页面中的账户数据
    this.loadAccounts();
    
    return true;
  },

  // 加载今日记录
  loadTodayRecords() {
    const records = wx.getStorageSync('records') || [];
    const today = this.data.currentDate;
    const todayRecords = records.filter(record => record.date === today);
    
    // 获取所有账户信息
    let accounts = wx.getStorageSync('accounts') || { accounts: [] };
    // 处理不同的账户数据结构
    let allAccounts = [];
    if (accounts.accounts) {
      // 新数据结构：{ accounts: [...] }
      allAccounts = accounts.accounts;
    } else if (accounts.deposit && accounts.liability) {
      // 旧数据结构：{ deposit: [...], liability: [...] }
      allAccounts = [...accounts.deposit, ...accounts.liability];
    } else {
      // 空数据结构
      allAccounts = [];
    }
    
    // 为每条记录添加账户名称
    const todayRecordsWithAccount = todayRecords.map(record => {
      const account = allAccounts.find(acc => acc.id === record.accountId);
      return {
        ...record,
        accountName: account ? account.name : '未知账户',
        accountIcon: account ? account.icon : '💵'
      };
    });
    
    this.setData({
      todayRecords: todayRecordsWithAccount
    });
  },

  // 输入框聚焦事件
  onInputFocus() {
    // 当输入框获得焦点时，确保输入区域可见
    this.setData({
      scrollTop: 0
    });
  },

  // 显示编辑记录对话框
  showEditRecordDialog(e) {
    const record = e.currentTarget.dataset.record;
    
    // 保存原始记录
    this.setData({
      showEditRecordDialog: true,
      editRecord: {...record},
      originalRecord: {...record}
    });
  },

  // 隐藏编辑记录对话框
  hideEditRecordDialog() {
    this.setData({
      showEditRecordDialog: false,
      editRecord: null,
      originalRecord: null
    });
  },

  // 编辑记录输入事件
  onEditAmountInput(e) {
    this.setData({
      'editRecord.amount': parseFloat(e.detail.value) || 0
    });
  },

  // 编辑记录类型选择
  onEditTypeChange(e) {
    const type = e.currentTarget.dataset.type;
    
    this.setData({
      'editRecord.type': type
    });
    
    // 重新加载分类数据
    this.loadCategories();
  },

  // 编辑记录分类选择
  onEditCategoryChange(e) {
    const categoryIndex = e.detail.value;
    const category = this.data.categoryData[categoryIndex];
    
    this.setData({
      'editRecord.category': category.name,
      'editRecord.selectedCategoryId': category.id
    });
    
    // 加载子分类
    this.loadSubcategories(categoryIndex);
  },

  // 编辑记录子分类选择
  onEditSubcategoryChange(e) {
    const subcategoryIndex = e.detail.value;
    const subcategory = this.data.subcategories[subcategoryIndex];
    
    this.setData({
      'editRecord.subcategory': subcategory.name,
      'editRecord.selectedSubcategoryId': subcategory.id
    });
  },

  // 编辑记录账户选择
  onEditAccountChange(e) {
    const accountId = e.currentTarget.dataset.id;
    const account = this.data.allAccounts.find(acc => acc.id === accountId);
    
    this.setData({
      'editRecord.accountId': accountId
    });
  },

  // 编辑记录备注输入
  onEditNoteInput(e) {
    this.setData({
      'editRecord.note': e.detail.value
    });
  },

  // 保存编辑记录
  saveEditRecord() {
    const { editRecord, originalRecord } = this.data;
    
    // 验证金额
    if (!editRecord.amount || editRecord.amount <= 0) {
      wx.showToast({
        title: '请输入有效金额',
        icon: 'none'
      });
      return;
    }
    
    // 验证分类
    if (!editRecord.category) {
      wx.showToast({
        title: '请选择分类',
        icon: 'none'
      });
      return;
    }
    
    // 验证账户
    if (!editRecord.accountId) {
      wx.showToast({
        title: '请选择账户',
        icon: 'none'
      });
      return;
    }
    
    // 获取所有记录
    let records = wx.getStorageSync('records') || [];
    
    // 找到要编辑的记录并更新
    records = records.map(record => {
      if (record.id === editRecord.id) {
        return {
          ...record,
          amount: editRecord.amount,
          type: editRecord.type,
          category: editRecord.category,
          subcategory: editRecord.subcategory,
          note: editRecord.note,
          accountId: editRecord.accountId
        };
      }
      return record;
    });
    
    // 保存更新后的记录
    wx.setStorageSync('records', records);
    
    // 更新账户余额
    // 1. 先恢复原始记录的余额
    this.restoreOriginalBalance(originalRecord);
    // 2. 再应用新记录的余额变化
    this.updateAccountBalance(editRecord);
    
    // 刷新今日记录
    this.loadTodayRecords();
    
    // 隐藏编辑对话框
    this.hideEditRecordDialog();
    
    wx.showToast({
      title: '编辑成功',
      icon: 'success'
    });
  },

  // 恢复原始记录的余额
  restoreOriginalBalance(record) {
    let accounts = wx.getStorageSync('accounts') || { accounts: [] };
    const amount = record.amount;
    const isIncome = record.type === '收入';
    const accountId = record.accountId;
    
    // 查找账户
    let account = null;
    let accountIndex = -1;
    let isNewStructure = false;
    
    if (accounts.accounts) {
      // 新数据结构：{ accounts: [...] }
      isNewStructure = true;
      accountIndex = accounts.accounts.findIndex(acc => acc.id === accountId);
      if (accountIndex !== -1) {
        account = accounts.accounts[accountIndex];
      }
    } else if (accounts.deposit && accounts.liability) {
      // 旧数据结构：{ deposit: [...], liability: [...] }
      let found = false;
      Object.keys(accounts).forEach(type => {
        if (found) return;
        const foundAccount = accounts[type].find(acc => acc.id === accountId);
        if (foundAccount) {
          account = foundAccount;
          found = true;
        }
      });
    }
    
    if (!account) {
      return;
    }
    
    // 恢复余额（与原始更新相反）
    let newBalance = account.balance;
    if (isIncome) {
      // 收入：恢复时减少余额
      newBalance -= amount;
    } else {
      // 支出：恢复时增加余额
      newBalance += amount;
    }
    
    // 更新账户余额
    if (isNewStructure) {
      // 新数据结构更新
      accounts.accounts[accountIndex] = { ...account, balance: newBalance };
    } else {
      // 旧数据结构更新
      Object.keys(accounts).forEach(type => {
        accounts[type] = accounts[type].map(acc => {
          if (acc.id === accountId) {
            return { ...acc, balance: newBalance };
          }
          return acc;
        });
      });
    }
    
    // 保存更新后的账户数据
    wx.setStorageSync('accounts', accounts);
  }
})