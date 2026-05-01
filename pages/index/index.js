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
    categoryData: [],
    subcategories: [],
    subcategoryIndex: 0,
    selectedCategoryId: null,
    selectedSubcategoryId: null,
    selectedAccountName: '',
    selectedCategoryName: '',
    selectedSubcategoryName: '',
    note: '',
       todayRecords: [],
       accounts: [],
       allAccounts: [],
       categorizedAccounts: [],
       accountCategories: [],
       selectedAccountId: null,
    // 选择器相关
    showAccountSelectorModal: false,
    showCategorySelectorModal: false,
    showSubcategorySelectorModal: false,
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

  // 添加 onShow 确保每次从其他页面返回时刷新数据
  onShow() {
    // 刷新分类数据（如果在分类管理页面做了修改）
    this.loadCategories();
    // 刷新账户数据（如果在账户管理页面做了修改）
    this.loadAccounts();
    // 刷新今日记录（可能添加了新记录）
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
    
    console.log('loadCategories - raw categories:', categories);
    
    let typeCategories = [];
    let categoryData = [];
    
    // 确保分类数据格式正确
    if (categories && categories.income && categories.expense) {
      // 确保旧数据兼容
      categories.income = categories.income.map(cat => ({
        ...cat,
        subcategories: (cat.subcategories || []).map(subcat => ({
          ...subcat,
          icon: subcat.icon || '📌'
        })),
        icon: cat.icon || '💰'
      }));
      categories.expense = categories.expense.map(cat => ({
        ...cat,
        subcategories: (cat.subcategories || []).map(subcat => ({
          ...subcat,
          icon: subcat.icon || '📌'
        })),
        icon: cat.icon || '💸'
      }));
      
      wx.setStorageSync('categories', categories);
      
      typeCategories = categories[categoryType].map(cat => cat.name);
      categoryData = categories[categoryType] || [];
    } else {
      // 默认分类
      const defaultCategories = {
        income: [
          { id: 1, name: '工资', subcategories: [], icon: '💼' },
          { id: 2, name: '奖金', subcategories: [], icon: '🏆' },
          { id: 3, name: '其他收入', subcategories: [], icon: '💰' }
        ],
        expense: [
          { id: 4, name: '餐饮', subcategories: [
            { id: 11, name: '早餐', icon: '🍳' },
            { id: 12, name: '午餐', icon: '🍜' },
            { id: 13, name: '晚餐', icon: '🍽️' },
            { id: 14, name: '水果', icon: '🍇' },
            { id: 15, name: '零食', icon: '🍬' },
            { id: 16, name: '饮料', icon: '🥤' }
          ], icon: '🍴' },
          { id: 5, name: '交通', subcategories: [], icon: '🚗' },
          { id: 6, name: '购物', subcategories: [], icon: '🛒' },
          { id: 7, name: '娱乐', subcategories: [], icon: '🎬' },
          { id: 8, name: '医疗', subcategories: [], icon: '🏥' },
          { id: 9, name: '教育', subcategories: [], icon: '📖' },
          { id: 10, name: '其他支出', subcategories: [], icon: '💳' }
        ]
      };
      
      wx.setStorageSync('categories', defaultCategories);
      categories = defaultCategories;
      
      typeCategories = categories[categoryType].map(cat => cat.name);
      categoryData = categories[categoryType] || [];
    }
    
    const categoriesWithIcons = categories[categoryType].map(cat => `${cat.icon} ${cat.name}`);
    
    console.log('loadCategories - result:', { categoryType, categoryDataLength: categoryData.length, categoryData });
    
    this.setData({
      categories: categoriesWithIcons,
      categoryIndex: 0,
      categoryData
    });
    
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
      selectedSubcategoryId: category && category.subcategories.length > 0 ? category.subcategories[0].id : null,
      // 同步更新显示的名称
      selectedCategoryName: category ? category.name : ''
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
          
          // 设置特定账户的图标
          let icon = account.icon || '💵';
          if (account.name === '支付宝') {
            icon = '🐜';
          } else if (account.name === '微信' || account.name === '微信钱包') {
            icon = '💬';
          }
          
          allAccounts.push({
            id: id++,
            name: account.name === '微信' ? '微信钱包' : account.name,
            balance: parseFloat(account.balance) || 0,
            icon: icon,
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
    
    // 确保所有账户都有category字段，并设置正确的图标
    const allAccounts = accounts.accounts.map(account => {
      let icon = account.icon || '💵';
      // 确保特定账户显示正确的图标
      if (account.name === '支付宝') {
        icon = '🐜';
      } else if (account.name === '微信钱包') {
        icon = '💬';
      }
      return {
        ...account,
        balance: parseFloat(account.balance) || 0,
        icon: icon
      };
    });
    
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
     
     console.log('loadAccounts:', { allAccounts, accounts });
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

  // 显示分类选择器
  showCategorySelector() {
    this.setData({
      showCategorySelectorModal: true
    });
  },
  
  // 隐藏分类选择器
  hideCategorySelector() {
    this.setData({
      showCategorySelectorModal: false
    });
  },
  
  // 选择分类
  selectCategory(e) {
    const index = Number(e.currentTarget.dataset.index);
    const categoryId = Number(e.currentTarget.dataset.id);
    const category = this.data.categoryData[index];
    
    this.setData({
      categoryIndex: index,
      selectedCategoryId: categoryId,
      selectedCategoryName: category ? category.name : '', // 直接保存名称
      showCategorySelectorModal: false
    });
    this.loadSubcategories(index);
  },
   
    // 获取分类名称
    getCategoryName(categoryId) {
      if (!this.data.categoryData || this.data.categoryData.length === 0) {
        return '未加载';
      }
      const category = this.data.categoryData.find(cat => cat.id == categoryId);
      return category ? category.name : '未知分类';
    },
   
   // 获取分类ID
   getCategoryIndex(categoryId) {
     return this.data.categoryData.findIndex(cat => cat.id === categoryId);
   },

  // 显示子分类选择器
  showSubcategorySelector() {
    this.setData({
      showSubcategorySelectorModal: true
    });
  },
  
  // 隐藏子分类选择器
  hideSubcategorySelector() {
    this.setData({
      showSubcategorySelectorModal: false
    });
  },
  
   // 选择子分类
   selectSubcategory(e) {
     const index = Number(e.currentTarget.dataset.index);
     const subcategoryId = Number(e.currentTarget.dataset.id);
     const category = this.data.categoryData[this.data.categoryIndex];
     const subcategory = category ? category.subcategories[index] : null;
     
     this.setData({
       subcategoryIndex: index,
       selectedSubcategoryId: subcategoryId,
       selectedSubcategoryName: subcategory ? subcategory.name : '', // 直接保存名称
       showSubcategorySelectorModal: false
     });
   },
  
  // 获取子分类名称
  getSubcategoryName(subcategoryId) {
    // 使用宽松比较
    const id = subcategoryId;
    
    // 遍历所有分类，查找包含指定子分类的分类
    for (let i = 0; i < this.data.categoryData.length; i++) {
      const category = this.data.categoryData[i];
      if (category && category.subcategories) {
        const subcategory = category.subcategories.find(sub => sub.id == id);
        if (subcategory) {
          return subcategory.name;
        }
      }
    }
    
    return '未知子分类';
  },
  
  // 阻止事件冒泡
  stopPropagation() {
    // 此函数用于阻止点击弹窗内容时触发背景关闭事件
  },
  
  // 显示账户选择器
  showAccountSelector() {
    this.setData({
      showAccountSelectorModal: true
    });
  },
  
  // 隐藏账户选择器
  hideAccountSelector() {
    this.setData({
      showAccountSelectorModal: false
    });
  },
  
    // 选择账户
    selectAccount(e) {
      // 强制转换为数字
      const accountId = Number(e.currentTarget.dataset.id);
      const account = this.data.allAccounts.find(acc => acc.id == accountId);
      
      this.setData({
        selectedAccountId: accountId,
        selectedAccountName: account ? account.name : '', // 直接保存名称
        showAccountSelectorModal: false
      });
    },
  
    // 获取账户名称
    getAccountName(accountId) {
      console.log('getAccountName called with:', accountId);
      if (accountId === null || accountId === undefined || accountId === '') {
        return '请选择账户';
      }
      if (!this.data.allAccounts || this.data.allAccounts.length === 0) {
        return '未加载';
      }
      
      // 打印前几个账户的ID和类型以便排查
      console.log('Account 0 ID:', this.data.allAccounts[0]?.id, typeof this.data.allAccounts[0]?.id);
      
      const account = this.data.allAccounts.find(acc => {
        // 严格打印每次比较
        return acc.id == accountId;
      });
      
      if (account) {
        return account.name;
      }
      return '未找到(ID:' + accountId + ')';
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
    // 切换类型后重新加载分类（会自动选中第一个并更新名称）
    this.loadCategories();
    // 重置子分类显示
    this.setData({
      selectedSubcategoryName: ''
    });
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
     let newBalance = account.balance || 0;
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
     const categoryIndex = this.getCategoryIndex(this.data.editRecord.selectedCategoryId);
     const subcategory = this.data.categoryData[categoryIndex].subcategories[subcategoryIndex];
     
     this.setData({
       'editRecord.subcategory': subcategory ? subcategory.name : '',
       'editRecord.selectedSubcategoryId': subcategory ? subcategory.id : null
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
    const amount = typeof editRecord.amount === 'string' ? parseFloat(editRecord.amount) : (editRecord.amount || 0);
    if (amount <= 0) {
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
           amount: amount,
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
     let newBalance = account.balance || 0;
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