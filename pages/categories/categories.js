// categories.js
const { getCategoryIcon } = require('../../utils/util');
// 从配置文件导入分类图标映射和预设图标列表
const { CATEGORY_ICONS, PRESET_ICONS } = require('../../config/constants');

Page({
  data: {
    activeTab: 'income',
    newCategoryName: '',
    newSubcategoryName: '',
    selectedCategoryId: null,
    showAddSubDialog: false,
    showEditDialog: false,
    editType: 'category', // category 或 subcategory
    editName: '',
    selectedIcon: '',
    editingId: null,
    editingCategoryId: null, // 仅用于子分类编辑
    availableIcons: PRESET_ICONS, // 使用全局配置的图标库
    categories: {
      income: [],
      expense: []
    },
    currentCategories: []
  },

  onLoad() {
    this.loadCategories();
  },

  // 加载分类数据
  loadCategories() {
    let categories = wx.getStorageSync('categories');
    
    // 如果没有分类数据，初始化默认分类
    if (!categories || !categories.income || !categories.expense) {
      categories = {
        income: [
          { id: 1, name: '工资', subcategories: [], expanded: false, icon: '💰' },
          { id: 2, name: '奖金', subcategories: [], expanded: false, icon: '🎁' },
          { id: 3, name: '其他收入', subcategories: [], expanded: false, icon: '📈' }
        ],
        expense: [
          { id: 4, name: '餐饮', subcategories: [
            { id: 11, name: '早餐', icon: '🍞' },
            { id: 12, name: '午餐', icon: '🍱' },
            { id: 13, name: '晚餐', icon: '🍜' },
            { id: 14, name: '水果', icon: '🍎' },
            { id: 15, name: '零食', icon: '🍪' },
            { id: 16, name: '饮料', icon: '🥤' }
          ], expanded: false, icon: '🍽️' },
          { id: 5, name: '交通', subcategories: [], expanded: false, icon: '🚗' },
          { id: 6, name: '购物', subcategories: [], expanded: false, icon: '🛍️' },
          { id: 7, name: '娱乐', subcategories: [], expanded: false, icon: '🎮' },
          { id: 8, name: '医疗', subcategories: [], expanded: false, icon: '🏥' },
          { id: 9, name: '教育', subcategories: [], expanded: false, icon: '📚' },
          { id: 10, name: '其他支出', subcategories: [], expanded: false, icon: '💸' }
        ]
      };
      wx.setStorageSync('categories', categories);
    } else {
      // 使用工具函数确保数据格式正确，并自动分配图标
      categories.income = categories.income.map(cat => ({
        ...cat,
        id: Number(cat.id),
        expanded: cat.expanded || false,
        icon: cat.icon || getCategoryIcon(cat.name, 'income'),
        subcategories: (cat.subcategories || []).map(subcat => ({
          ...subcat,
          id: Number(subcat.id),
          icon: subcat.icon || getCategoryIcon(subcat.name, 'subcategory')
        }))
      }));
      categories.expense = categories.expense.map(cat => ({
        ...cat,
        id: Number(cat.id),
        expanded: cat.expanded || false,
        icon: cat.icon || getCategoryIcon(cat.name, 'expense'),
        subcategories: (cat.subcategories || []).map(subcat => ({
          ...subcat,
          id: Number(subcat.id),
          icon: subcat.icon || getCategoryIcon(subcat.name, 'subcategory')
        }))
      }));
      wx.setStorageSync('categories', categories);
    }
    
    const tab = this.data.activeTab || 'income';
    this.setData({
      categories,
      currentCategories: categories[tab],
      activeTab: tab
    });
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab,
      currentCategories: this.data.categories[tab],
      expandedCategories: [],
      newCategoryName: ''
    });
  },

  // 新分类名称输入
  onNewCategoryInput(e) {
    this.setData({
      newCategoryName: e.detail.value
    });
  },

  // 添加分类
  addCategory() {
    const { newCategoryName, activeTab, categories } = this.data;
    
    if (!newCategoryName.trim()) {
      wx.showToast({
        title: '请输入分类名称',
        icon: 'none'
      });
      return;
    }
    
    // 检查分类名称是否已存在
    const isDuplicate = categories[activeTab].some(cat => cat.name === newCategoryName.trim());
    if (isDuplicate) {
      wx.showToast({
        title: '分类名称已存在',
        icon: 'none'
      });
      return;
    }
    
    // 生成新的分类ID
    const maxId = Math.max(...categories[activeTab].map(cat => cat.id), 0);
    const newCategory = {
      id: maxId + 1,
      name: newCategoryName.trim(),
      subcategories: [],
      expanded: false,
      icon: getCategoryIcon(newCategoryName.trim(), activeTab)
    };
    
    // 更新分类数据
    categories[activeTab].push(newCategory);
    
    this.setData({
      categories,
      currentCategories: categories[activeTab],
      newCategoryName: ''
    });
    
    // 保存到本地存储
    wx.setStorageSync('categories', categories);
    
    wx.showToast({
      title: '添加成功',
      icon: 'success'
    });
  },

  // 编辑分类
  editCategory(e) {
    const id = e.currentTarget.dataset.id;
    const { activeTab, categories } = this.data;
    
    const category = categories[activeTab].find(cat => cat.id === id);
    if (!category) return;
    
    // 显示自定义编辑弹窗
    this.setData({
      showEditDialog: true,
      editType: 'category',
      editName: category.name,
      selectedIcon: category.icon,
      editingId: id
    });
  },

  // 编辑子分类
  editSubcategory(e) {
    const categoryId = Number(e.currentTarget.dataset.categoryId);
    const subcategoryId = Number(e.currentTarget.dataset.subcategoryId);
    const { activeTab, categories } = this.data;
    
    // 找到对应的父分类和子分类
    const categoryIndex = categories[activeTab].findIndex(cat => cat.id === categoryId);
    if (categoryIndex === -1) return;
    
    const category = categories[activeTab][categoryIndex];
    const subcategory = category.subcategories.find(subcat => subcat.id === subcategoryId);
    if (!subcategory) return;
    
    // 显示自定义编辑弹窗
    this.setData({
      showEditDialog: true,
      editType: 'subcategory',
      editName: subcategory.name,
      selectedIcon: subcategory.icon,
      editingId: subcategoryId,
      editingCategoryId: categoryId
    });
  },

  // 编辑名称输入
  onEditNameInput(e) {
    this.setData({
      editName: e.detail.value
    });
  },

  // 选择图标
  selectIcon(e) {
    const icon = e.currentTarget.dataset.icon;
    this.setData({
      selectedIcon: icon
    });
  },

  // 保存编辑
  saveEdit() {
    const { 
      editType, editName, selectedIcon, editingId, 
      editingCategoryId, activeTab, categories 
    } = this.data;
    
    if (!editName.trim()) {
      wx.showToast({
        title: '请输入名称',
        icon: 'none'
      });
      return;
    }
    
    let updatedCategories = [...categories[activeTab]];
    
    if (editType === 'category') {
      // 检查分类名称是否已存在
      const isDuplicate = updatedCategories.some(cat => cat.id !== editingId && cat.name === editName.trim());
      if (isDuplicate) {
        wx.showToast({
          title: '分类名称已存在',
          icon: 'none'
        });
        return;
      }
      
      // 更新分类
      updatedCategories = updatedCategories.map(cat => {
        if (cat.id === editingId) {
          return { 
            ...cat, 
            name: editName.trim(),
            icon: selectedIcon
          };
        }
        return cat;
      });
    } else {
      // 子分类编辑
      updatedCategories = updatedCategories.map(category => {
        if (category.id === editingCategoryId) {
          // 检查子分类名称是否已存在
          const isDuplicate = category.subcategories.some(
            subcat => subcat.id !== editingId && subcat.name === editName.trim()
          );
          if (isDuplicate) {
            wx.showToast({
              title: '子分类名称已存在',
              icon: 'none'
            });
            return category;
          }
          
          // 更新子分类
          const updatedSubcategories = category.subcategories.map(subcat => {
            if (subcat.id === editingId) {
              return { 
                ...subcat, 
                name: editName.trim(),
                icon: selectedIcon
              };
            }
            return subcat;
          });
          
          return { ...category, subcategories: updatedSubcategories };
        }
        return category;
      });
    }
    
    // 更新数据
    const newCategories = {
      ...categories,
      [activeTab]: updatedCategories
    };
    
    this.setData({
      categories: newCategories,
      currentCategories: updatedCategories,
      showEditDialog: false
    });
    
    // 保存到本地存储
    wx.setStorageSync('categories', newCategories);
    
    wx.showToast({
      title: '修改成功',
      icon: 'success'
    });
  },

  // 隐藏编辑弹窗
  hideEditDialog() {
    this.setData({
      showEditDialog: false
    });
  },

  // 删除分类
  deleteCategory(e) {
    const id = e.currentTarget.dataset.id;
    const { activeTab, categories } = this.data;
    
    wx.showModal({
      title: '删除分类',
      content: '确定要删除这个分类吗？',
      confirmText: '删除',
      cancelText: '取消',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          // 过滤掉要删除的分类
          const updatedCategories = categories[activeTab].filter(cat => cat.id !== id);
          
          categories[activeTab] = updatedCategories;
          
          this.setData({
            categories,
            currentCategories: updatedCategories
          });
          
          // 保存到本地存储
          wx.setStorageSync('categories', categories);
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 展开/收起子分类
  toggleSubcategories(e) {
    const id = Number(e.currentTarget.dataset.id);
    const { activeTab, categories } = this.data;
    
    // 找到对应的分类并切换expanded状态
    const updatedCategories = categories[activeTab].map(cat => {
      if (cat.id === id) {
        return { ...cat, expanded: !cat.expanded };
      }
      return cat;
    });
    
    // 更新分类数据
    const newCategories = {
      ...categories,
      [activeTab]: updatedCategories
    };
    
    this.setData({
      categories: newCategories,
      currentCategories: updatedCategories
    });
    
    // 保存到本地存储
    wx.setStorageSync('categories', newCategories);
  },

  // 显示添加子分类对话框
  showAddSubcategoryDialog(e) {
    const categoryId = Number(e.currentTarget.dataset.categoryId);
    this.setData({
      selectedCategoryId: categoryId,
      showAddSubDialog: true,
      newSubcategoryName: '',
      selectedIcon: '📌' // 默认图标
    });
  },

  // 隐藏添加子分类对话框
  hideAddSubcategoryDialog() {
    this.setData({
      showAddSubDialog: false,
      selectedCategoryId: null,
      newSubcategoryName: '',
      selectedIcon: ''
    });
  },

  // 新子分类名称输入
  onNewSubcategoryInput(e) {
    this.setData({
      newSubcategoryName: e.detail.value
    });
  },

  // 添加子分类
  addSubcategory() {
    const { newSubcategoryName, selectedCategoryId, activeTab, categories, selectedIcon } = this.data;
    
    if (!newSubcategoryName.trim()) {
      wx.showToast({
        title: '请输入子分类名称',
        icon: 'none'
      });
      return;
    }
    
    // 找到对应的父分类
    const categoryIndex = categories[activeTab].findIndex(cat => cat.id === selectedCategoryId);
    if (categoryIndex === -1) {
      wx.showToast({
        title: '分类不存在',
        icon: 'none'
      });
      return;
    }
    
    const category = categories[activeTab][categoryIndex];
    
    // 检查子分类名称是否已存在
    const isDuplicate = category.subcategories.some(subcat => subcat.name === newSubcategoryName.trim());
    if (isDuplicate) {
      wx.showToast({
        title: '子分类名称已存在',
        icon: 'none'
      });
      return;
    }
    
    // 生成新的子分类ID
    const allIds = [];
    categories[activeTab].forEach(cat => {
      allIds.push(cat.id);
      cat.subcategories.forEach(subcat => allIds.push(subcat.id));
    });
    const maxId = Math.max(...allIds, 0);
    const newSubcategory = {
      id: maxId + 1,
      name: newSubcategoryName.trim(),
      icon: selectedIcon || getCategoryIcon(newSubcategoryName.trim(), 'subcategory')
    };
    
    // 更新子分类数据
    category.subcategories.push(newSubcategory);
    categories[activeTab][categoryIndex] = category;
    
    this.setData({
      categories,
      currentCategories: categories[activeTab],
      showAddSubDialog: false,
      newSubcategoryName: '',
      selectedCategoryId: null,
      selectedIcon: ''
    });
    
    // 保存到本地存储
    wx.setStorageSync('categories', categories);
    
    wx.showToast({
      title: '添加成功',
      icon: 'success'
    });
  },

  // 删除子分类
  deleteSubcategory(e) {
    const categoryId = Number(e.currentTarget.dataset.categoryId);
    const subcategoryId = Number(e.currentTarget.dataset.subcategoryId);
    const { activeTab, categories } = this.data;
    
    wx.showModal({
      title: '删除子分类',
      content: '确定要删除这个子分类吗？',
      confirmText: '删除',
      cancelText: '取消',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          // 找到对应的父分类
          const categoryIndex = categories[activeTab].findIndex(cat => cat.id === categoryId);
          if (categoryIndex === -1) return;
          
          const category = categories[activeTab][categoryIndex];
          
          // 过滤掉要删除的子分类
          const updatedSubcategories = category.subcategories.filter(subcat => subcat.id !== subcategoryId);
          
          category.subcategories = updatedSubcategories;
          categories[activeTab][categoryIndex] = category;
          
          this.setData({
            categories,
            currentCategories: categories[activeTab]
          });
          
          // 保存到本地存储
          wx.setStorageSync('categories', categories);
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
       }
     });
   },
   
   // 阻止事件冒泡
   stopPropagation() {
     // 此函数用于阻止点击展开/收起按钮时触发父元素的点击事件
   }
})