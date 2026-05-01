// budget.js
Page({
  data: {
    currentMonth: '',
    budgets: [],
    showAddBudgetDialog: false,
    newBudget: {
      category: '',
      subcategory: '',
      amount: 0,
      spent: 0
    },
    categories: [],
    subcategories: [],
    categoryIndex: 0,
    subcategoryIndex: 0,
    categoryData: []
  },

  onLoad() {
    this.initCurrentMonth();
    this.loadCategories();
    this.loadBudgets();
  },

  onShow() {
    this.loadBudgets();
  },

  // 初始化当前月份
  initCurrentMonth() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    this.setData({
      currentMonth: `${year}-${month}`
    });
  },

  // 加载分类数据
  loadCategories() {
    let categories = wx.getStorageSync('categories') || {
      income: [],
      expense: []
    };

    // 确保分类数据格式正确
    if (categories.income) {
      categories.income = categories.income.map(cat => ({
        ...cat,
        subcategories: cat.subcategories || [],
        icon: cat.icon || '📌'
      }));
    }

    if (categories.expense) {
      categories.expense = categories.expense.map(cat => ({
        ...cat,
        subcategories: cat.subcategories || [],
        icon: cat.icon || '📌'
      }));
    }

    // 只使用支出分类
    const expenseCategories = categories.expense;
    const categoriesWithIcons = expenseCategories.map(cat => `${cat.icon} ${cat.name}`);

    this.setData({
      categories: categoriesWithIcons,
      categoryData: expenseCategories
    });

    // 加载第一个分类的子分类
    if (expenseCategories.length > 0) {
      this.loadSubcategories(0);
    }
  },

  // 加载子分类数据
  loadSubcategories(categoryIndex) {
    const category = this.data.categoryData[categoryIndex];
    const subcategories = category ? category.subcategories.map(subcat => `${subcat.icon} ${subcat.name}`) : [];

    this.setData({
      subcategories,
      subcategoryIndex: 0
    });
  },

   // 加载预算数据
   loadBudgets() {
     const budgets = wx.getStorageSync('budgets') || {};
     const month = this.data.currentMonth || '';
     const monthBudgets = budgets[month] || [];

     // 计算预算使用情况
     const updatedBudgets = monthBudgets.map(budget => {
       const category = budget.category || '';
       const subcategory = budget.subcategory || '';
       
       const spent = this.calculateSpent(category, subcategory);
       const amount = parseFloat(budget.amount) || 0;
       const validSpent = parseFloat(spent) || 0;
      
     // 计算进度百分比
     let percentage = 0;
     if (amount > 0) {
       percentage = Math.min(Math.max(Math.round((validSpent / amount) * 100), 0), 100);
     }
      
      return {
        ...budget,
        amount,
        spent: validSpent,
        remaining: amount - validSpent,
        percentage: percentage
      };
    });

    this.setData({
      budgets: updatedBudgets
    });
  },

   // 计算已使用金额
   calculateSpent(category, subcategory) {
     const records = wx.getStorageSync('records') || [];
     const month = this.data.currentMonth || '';

     let spent = 0;
     const targetCategory = category || '';
     const targetSubcategory = subcategory || '';
    
    // 遍历记录，只计算当前分类和子分类的支出
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        // 跳过无效记录
        if (!record || !record.date || !record.category || !record.type) continue;
        // 检查是否是当前月份的记录
        if (!record.date || !record.date.startsWith(month)) continue;
        // 检查是否是支出
        if (record.type !== '支出') continue;
        // 检查分类是否匹配
        if (record.category !== targetCategory) continue;
      
       // 检查子分类是否匹配
       let isRelevant = false;
       if (!targetSubcategory) {
         // 如果预算没有设置子分类，只匹配没有子分类的记录
         isRelevant = !record.subcategory;
       } else {
         // 如果预算设置了子分类，检查记录的子分类是否包含该子分类
         isRelevant = record.subcategory && (record.subcategory === targetSubcategory || record.subcategory.includes(targetSubcategory));
       }
       
       if (!isRelevant) continue;
       
       // 只累加正数的支出金额
     const recordAmount = parseFloat(record.amount) || 0;
     if (recordAmount > 0) {
       spent += recordAmount;
     }
     }

     return spent > 0 ? spent : 0;
   },

  // 显示添加预算对话框
  showAddBudgetDialog() {
    this.setData({
      showAddBudgetDialog: true,
      newBudget: {
        category: '',
        subcategory: '',
        amount: 0,
        spent: 0
      }
    });
  },

  // 隐藏添加预算对话框
  hideAddBudgetDialog() {
    this.setData({
      showAddBudgetDialog: false
    });
  },

  // 分类选择事件
  onCategoryChange(e) {
    const categoryIndex = e.detail.value;
    this.setData({
      categoryIndex: categoryIndex
    });
    this.loadSubcategories(categoryIndex);
  },

  // 子分类选择事件
  onSubcategoryChange(e) {
    this.setData({
      subcategoryIndex: e.detail.value
    });
  },

  // 预算金额输入事件
  onAmountInput(e) {
    this.setData({
      'newBudget.amount': parseFloat(e.detail.value) || 0
    });
  },

  // 添加预算
  addBudget() {
    const category = this.data.categoryData[this.data.categoryIndex];
    const subcategory = category.subcategories[this.data.subcategoryIndex];

     if (!category) {
       wx.showToast({
         title: '请选择分类',
         icon: 'none'
       });
       return;
     }
     
     const amount = typeof this.data.newBudget.amount === 'string' ? parseFloat(this.data.newBudget.amount) : (this.data.newBudget.amount || 0);
     if (!amount) {
       wx.showToast({
         title: '请输入有效金额',
         icon: 'none'
       });
       return;
     }

    const newBudget = {
      category: category.name,
      subcategory: subcategory ? subcategory.name : '',
       amount: amount,
      spent: 0
    };

    // 保存预算
    const budgets = wx.getStorageSync('budgets') || {};
    if (!budgets[this.data.currentMonth]) {
      budgets[this.data.currentMonth] = [];
    }

    // 检查是否已存在相同分类和子分类的预算
    const existingIndex = budgets[this.data.currentMonth].findIndex(budget => 
      budget.category === newBudget.category && 
      budget.subcategory === newBudget.subcategory
    );

    if (existingIndex >= 0) {
      // 更新现有预算
      budgets[this.data.currentMonth][existingIndex] = newBudget;
    } else {
      // 添加新预算
      budgets[this.data.currentMonth].push(newBudget);
    }

    wx.setStorageSync('budgets', budgets);
    this.loadBudgets();
    this.hideAddBudgetDialog();

    wx.showToast({
      title: '预算设置成功',
      icon: 'success'
    });
  },

  // 删除预算
  deleteBudget(e) {
    const index = e.currentTarget.dataset.index;
    const budgets = wx.getStorageSync('budgets') || {};
    const monthBudgets = budgets[this.data.currentMonth] || [];

    monthBudgets.splice(index, 1);
    budgets[this.data.currentMonth] = monthBudgets;
    wx.setStorageSync('budgets', budgets);
    this.loadBudgets();

    wx.showToast({
      title: '预算删除成功',
      icon: 'success'
    });
  }
});
