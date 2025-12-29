// index.js
Page({
  data: {
    currentDate: '',
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
    todayRecords: []
  },

  onLoad() {
    this.initCurrentDate();
    this.loadCategories();
    this.loadTodayRecords();
  },

  // 初始化当前日期
  initCurrentDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    this.setData({
      currentDate: `${year}-${month}-${day}`
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
      if (type === '收入') {
        typeCategories = ['工资', '奖金', '其他收入'];
        categoryData = [
          { id: 1, name: '工资', subcategories: [], icon: '💰' },
          { id: 2, name: '奖金', subcategories: [], icon: '🎁' },
          { id: 3, name: '其他收入', subcategories: [], icon: '📈' }
        ];
      } else {
        typeCategories = ['餐饮', '交通', '购物', '娱乐', '医疗', '教育', '其他支出'];
        categoryData = [
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
        ];
        // 保存默认数据到本地存储
        const defaultCategories = {
          income: [
            { id: 1, name: '工资', subcategories: [], icon: '💰' },
            { id: 2, name: '奖金', subcategories: [], icon: '🎁' },
            { id: 3, name: '其他收入', subcategories: [], icon: '📈' }
          ],
          expense: categoryData
        };
        wx.setStorageSync('categories', defaultCategories);
      }
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

  // 金额输入事件
  onAmountInput(e) {
    this.setData({
      amount: e.detail.value
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

    // 提取分类名称（去除图标）
    const categoryFull = this.data.categories[this.data.categoryIndex];
    const category = categoryFull ? categoryFull.replace(/^\p{Emoji}\s*/u, '') : '';
    
    // 提取子分类名称（去除图标）
    const subcategoryFull = this.data.subcategories.length > 0 ? this.data.subcategories[this.data.subcategoryIndex] : '';
    const subcategory = subcategoryFull ? subcategoryFull.replace(/^\p{Emoji}\s*/u, '') : '';
    
    const record = {
      id: Date.now(),
      date: this.data.currentDate,
      amount: parseFloat(this.data.amount),
      type: this.data.types[this.data.typeIndex],
      category: category,
      subcategory: subcategory,
      note: this.data.note
    };

    // 保存到本地存储
    this.saveRecord(record);
    
    // 刷新今日记录
    this.loadTodayRecords();
    
    // 清空表单
    this.setData({
      amount: '',
      typeIndex: 0,
      categoryIndex: 0,
      note: ''
    });

    wx.showToast({
      title: '添加成功',
      icon: 'success'
    });
  },

  // 保存记录到本地存储
  saveRecord(record) {
    const records = wx.getStorageSync('records') || [];
    records.push(record);
    wx.setStorageSync('records', records);
  },

  // 加载今日记录
  loadTodayRecords() {
    const records = wx.getStorageSync('records') || [];
    const today = this.data.currentDate;
    const todayRecords = records.filter(record => record.date === today);
    this.setData({
      todayRecords: todayRecords
    });
  },

  // 输入框聚焦事件
  onInputFocus() {
    // 当输入框获得焦点时，确保输入区域可见
    this.setData({
      scrollTop: 0
    });
  }
})