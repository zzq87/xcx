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
    
    // 如果没有账户数据，初始化默认账户
    if (!accounts) {
      accounts = {
        deposit: [
          { id: 1, name: '现金', balance: 0, icon: '💵' },
          { id: 2, name: '银行卡', balance: 0, icon: '💳' },
          { id: 3, name: '支付宝', balance: 0, icon: '🐜' },
          { id: 4, name: '微信', balance: 0, icon: '💬' }
        ],
        liability: [
          { id: 5, name: '信用卡', balance: 0, icon: '💳' },
          { id: 6, name: '花呗', balance: 0, icon: '🌸' },
          { id: 7, name: '银行贷款', balance: 0, icon: '🏦' },
          { id: 8, name: '借给他人', balance: 0, icon: '👤' },
          { id: 9, name: '借用他人', balance: 0, icon: '🤝' }
        ]
      };
      wx.setStorageSync('accounts', accounts);
    }
    
    // 确保所有账户余额都是数字类型
    Object.keys(accounts).forEach(type => {
      accounts[type] = accounts[type].map(account => ({
        ...account,
        balance: parseFloat(account.balance) || 0
      }));
    });
    
    // 合并所有账户到一个数组
    const allAccounts = [...accounts.deposit, ...accounts.liability];
    
    // 构建包含图标和名称的账户数组
    const accountsWithIcons = allAccounts.map(account => `${account.icon} ${account.name}`);
    
    this.setData({
      allAccounts,
      accounts: accountsWithIcons
    });
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
    this.setData({
      typeIndex: e.detail.value
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
    
    // 查找账户及其类型
    let account = null;
    let accountType = '';
    
    Object.keys(accounts).forEach(type => {
      const foundAccount = accounts[type].find(acc => acc.id === accountId);
      if (foundAccount) {
        account = foundAccount;
        accountType = type;
      }
    });
    
    if (!account) {
      return;
    }
    
    // 计算新余额并验证，负债账户的逻辑与存款账户相反
    let newBalance;
    if (accountType === 'deposit') {
      // 存款账户：收入增加余额，支出减少余额
      newBalance = isIncome ? account.balance + amount : account.balance - amount;
    } else {
      // 负债账户：收入减少负债（余额更正，变得更接近0），支出增加负债（余额更负）
      newBalance = isIncome ? account.balance - amount : account.balance + amount;
    }
    
    // 验证余额：存款账户不能为负，负债账户不能为正
    if (accountType === 'deposit' && newBalance < 0) {
      wx.showToast({
        title: '存款账户余额不能为负数',
        icon: 'none'
      });
      return false;
    }
    
    if (accountType === 'liability' && newBalance > 0) {
      wx.showToast({
        title: '负债账户余额不能为正数',
        icon: 'none'
      });
      return false;
    }
    
    // 更新对应账户的余额
    Object.keys(accounts).forEach(type => {
      accounts[type] = accounts[type].map(acc => {
        if (acc.id === accountId) {
          return { ...acc, balance: newBalance };
        }
        return acc;
      });
    });
    
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
    let accounts = wx.getStorageSync('accounts') || { deposit: [], liability: [] };
    // 合并所有账户到一个数组
    const allAccounts = [...accounts.deposit, ...accounts.liability];
    
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
    const typeIndex = e.detail.value;
    const type = this.data.types[typeIndex];
    
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
    let accounts = wx.getStorageSync('accounts') || { deposit: [], liability: [] };
    const amount = record.amount;
    const isIncome = record.type === '收入';
    const accountId = record.accountId;
    
    // 查找账户及其类型
    let account = null;
    let accountType = '';
    
    Object.keys(accounts).forEach(type => {
      const foundAccount = accounts[type].find(acc => acc.id === accountId);
      if (foundAccount) {
        account = foundAccount;
        accountType = type;
      }
    });
    
    if (!account) {
      return;
    }
    
    // 恢复余额（与原始更新相反）
    let newBalance;
    if (accountType === 'deposit') {
      // 存款账户：收入增加余额，支出减少余额，恢复则相反
      newBalance = isIncome ? account.balance - amount : account.balance + amount;
    } else {
      // 负债账户：收入减少负债，支出增加负债，恢复则相反
      newBalance = isIncome ? account.balance + amount : account.balance - amount;
    }
    
    // 更新对应账户的余额
    Object.keys(accounts).forEach(type => {
      accounts[type] = accounts[type].map(acc => {
        if (acc.id === accountId) {
          return { ...acc, balance: newBalance };
        }
        return acc;
      });
    });
    
    // 保存更新后的账户数据
    wx.setStorageSync('accounts', accounts);
  }
})