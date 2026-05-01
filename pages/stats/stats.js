// 修复后的 stats.js
Page({
  data: {
    currentDate: '',
    startDate: '',
    endDate: '',
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    categoryStats: {},
    subcategoryStats: {},
    dailyStats: {},
    chartType: 'category', // category 或 subcategory
    activeQuickDate: '' // 当前选中的快捷日期选项
  },

  onLoad() {
    this.initCurrentMonth();
    this.loadStatsData();
  },
  
  onShow() {
    this.loadStatsData();
  },
  
  // 初始化当前日期
  initCurrentMonth() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    
    this.setData({
       currentDate: today,
       startDate: today,
       endDate: today
     });
  },
  
  // 开始日期变化
  onStartDateChange(e) {
    const startDate = e.detail.value;
    let { endDate } = this.data;
    
    // 确保开始日期不晚于结束日期
    if (startDate > endDate) {
      endDate = startDate;
    }
    
    // 更新显示的日期范围
    let displayDate = startDate;
    if (startDate !== endDate) {
      displayDate = `${startDate} 至 ${endDate}`;
    }
    
    this.setData({
      startDate: startDate,
      endDate: endDate,
      currentDate: displayDate,
      activeQuickDate: '' // 清除快捷日期选中状态
    });
    
    // 重新加载统计数据
    this.loadStatsData();
  },
  
  // 结束日期变化
  onEndDateChange(e) {
    const endDate = e.detail.value;
    const { startDate } = this.data;
    
    // 更新显示的日期范围
    let displayDate = startDate;
    if (startDate !== endDate) {
      displayDate = `${startDate} 至 ${endDate}`;
    }
    
    this.setData({
      endDate: endDate,
      currentDate: displayDate,
      activeQuickDate: '' // 清除快捷日期选中状态
    });
    
    // 重新加载统计数据
    this.loadStatsData();
  },
  
  // 快捷日期选择
  onQuickDateSelect(e) {
    const type = e.currentTarget.dataset.type;
    const today = new Date();
    let startDate = '';
    let endDate = '';
    
    // 格式化日期为 yyyy-MM-dd 格式
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    endDate = formatDate(today);
    
    switch (type) {
      case 'week':
        // 计算本周的开始日期（周一）
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startDate = formatDate(new Date(today.setDate(diff)));
        break;
      case 'month':
        // 计算本月的开始日期（1号）
        startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
        break;
      case 'threeMonth':
        // 计算三个月前的开始日期
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 2); // 减去2个月，加上当前月，共3个月
        threeMonthsAgo.setDate(1); // 设置为1号
        startDate = formatDate(threeMonthsAgo);
        break;
      default:
        break;
    }
    
    // 更新显示的日期范围
    let displayDate = startDate;
    if (startDate !== endDate) {
      displayDate = `${startDate} 至 ${endDate}`;
    }
    
    this.setData({
      startDate: startDate,
      endDate: endDate,
      currentDate: displayDate,
      activeQuickDate: type
    });
    
    // 重新加载统计数据
    this.loadStatsData();
  },

  // 加载统计数据
  loadStatsData() {
    const records = wx.getStorageSync('records') || [];
    
    // 筛选日期范围内的记录
    let filteredRecords = [];
    if (this.data.startDate === this.data.endDate) {
      // 如果是同一天，筛选当天记录
      filteredRecords = records.filter(record => {
        return record.date === this.data.startDate;
      });
    } else {
      // 如果是日期范围，筛选范围内的记录
      filteredRecords = records.filter(record => {
        return record.date >= this.data.startDate && record.date <= this.data.endDate;
      });
    }
    
    // 计算总收入和总支出
    let totalIncome = 0;
    let totalExpense = 0;
    
    // 分类统计
    const categoryStats = {};
    // 子分类统计
    const subcategoryStats = {};
    // 日统计
    const dailyStats = {};
    
    filteredRecords.forEach(record => {
      if (record.type === '收入') {
        totalIncome += record.amount;
      } else {
        totalExpense += record.amount;
      }
      
      // 分类统计
      if (!categoryStats[record.category]) {
        categoryStats[record.category] = { income: 0, expense: 0 };
      }
      categoryStats[record.category][record.type === '收入' ? 'income' : 'expense'] += record.amount;
      
      // 子分类统计
      const subcategoryKey = record.subcategory ? `${record.category}-${record.subcategory}` : record.category;
      if (!subcategoryStats[subcategoryKey]) {
        subcategoryStats[subcategoryKey] = {
          category: record.category,
          subcategory: record.subcategory || '',
          displayName: record.subcategory ? `${record.category}-${record.subcategory}` : record.category,
          income: 0,
          expense: 0
        };
      }
      subcategoryStats[subcategoryKey][record.type === '收入' ? 'income' : 'expense'] += record.amount;
      
      // 日统计：使用完整日期作为键，确保正确排序
      const fullDate = record.date;
      if (!dailyStats[fullDate]) {
        dailyStats[fullDate] = { income: 0, expense: 0 };
      }
      dailyStats[fullDate][record.type === '收入' ? 'income' : 'expense'] += record.amount;
    });
    
    const balance = totalIncome - totalExpense;
    
    this.setData({
      totalIncome,
      totalExpense,
      balance,
      categoryStats,
      subcategoryStats,
      dailyStats
    });
    
    // 绘制图表
    this.drawCategoryChart();
    this.drawDailyChart();
  },

  // 切换图表类型
  switchChartType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      chartType: type
    });
    // 重新绘制图表
    this.drawCategoryChart();
  },

  // 绘制分类统计图表
  drawCategoryChart() {
    const query = wx.createSelectorQuery();
    query.select('#categoryChart').fields({ node: true, size: true });
    query.exec((res) => {
      if (!res || !res[0] || !res[0].node) return;
      
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const systemInfo = wx.getSystemInfoSync();
      const dpr = systemInfo.pixelRatio;
      canvas.width = res[0].width * dpr;
      canvas.height = res[0].height * dpr;
      ctx.scale(dpr, dpr);
      
      const chartType = this.data.chartType;
      let stats = {};
      let items = [];
      
      // 根据图表类型选择统计数据
      if (chartType === 'category') {
        stats = this.data.categoryStats;
        items = Object.keys(stats);
      } else {
        stats = this.data.subcategoryStats;
        items = Object.keys(stats).map(key => stats[key].displayName);
      }
      
      const chartWidth = res[0].width;
      const chartHeight = res[0].height;
    
      // 绘制背景
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, chartWidth, chartHeight);
    
      // 绘制坐标轴
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 1;
      // X轴
      ctx.beginPath();
      ctx.moveTo(40, chartHeight - 40);
      ctx.lineTo(chartWidth - 20, chartHeight - 40);
      ctx.stroke();
      // Y轴
      ctx.beginPath();
      ctx.moveTo(40, 20);
      ctx.lineTo(40, chartHeight - 40);
      ctx.stroke();
    
      // 如果没有数据，显示提示文字
      if (items.length === 0) {
        ctx.fillStyle = '#999';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('暂无统计数据', chartWidth / 2, chartHeight / 2);
        return;
      }
    
      // 计算最大值
      let maxValue = 0;
      items.forEach((item, index) => {
        let stat;
        if (chartType === 'category') {
          stat = stats[item];
        } else {
          const key = Object.keys(stats)[index];
          stat = stats[key];
        }
        // 考虑收入和支出的最大值
        const value = Math.max(stat.income, stat.expense);
        if (value > maxValue) {
          maxValue = value;
        }
      });
    
      // 防止除以0
      if (maxValue === 0) maxValue = 1;
    
      // 绘制柱状图
      const barWidth = (chartWidth - 60) / (items.length * 3);
      const gap = barWidth;
    
      items.forEach((item, index) => {
        let stat;
        if (chartType === 'category') {
          stat = stats[item];
        } else {
          const key = Object.keys(stats)[index];
          stat = stats[key];
        }
        const x = 40 + index * (barWidth * 2 + gap) + gap;
        
        // 确保金额为正数（如果是支出，取绝对值）
        const incomeValue = Math.abs(stat.income);
        const expenseValue = Math.abs(stat.expense);
        
        // 绘制收入柱
        const incomeHeight = (incomeValue / maxValue) * (chartHeight - 60);
        ctx.fillStyle = '#07c160';
        ctx.fillRect(x, chartHeight - 40 - incomeHeight, barWidth, incomeHeight);
        
        // 绘制支出柱
        const expenseHeight = (expenseValue / maxValue) * (chartHeight - 60);
        ctx.fillStyle = '#ff4d4f';
        ctx.fillRect(x + barWidth, chartHeight - 40 - expenseHeight, barWidth, expenseHeight);
        
        // 绘制分类名称
        ctx.fillStyle = '#666';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        
        // 子分类名称可能较长，旋转显示
        if (chartType === 'subcategory') {
          ctx.save();
          ctx.translate(x + barWidth, chartHeight - 20);
          ctx.rotate(-Math.PI / 4);
          ctx.fillText(item, 0, 0);
          ctx.restore();
        } else {
          ctx.fillText(item, x + barWidth, chartHeight - 20);
        }
      });
    
      // 绘制图例
      ctx.fillStyle = '#07c160';
      ctx.fillRect(40, 10, 10, 10);
      ctx.fillStyle = '#666';
      ctx.font = `${Math.max(10, chartHeight / 20)}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText('收入', 60, 20);
    
      ctx.fillStyle = '#ff4d4f';
      ctx.fillRect(120, 10, 10, 10);
      ctx.fillStyle = '#666';
      ctx.textAlign = 'left';
      ctx.fillText('支出', 140, 20);
    
      // Canvas 2D 会自动渲染，不需要额外操作
    });
  },

  // 绘制日统计图表
  drawDailyChart() {
    const query = wx.createSelectorQuery();
    query.select('#dailyChart').fields({ node: true, size: true });
    query.exec((res) => {
      if (!res || !res[0] || !res[0].node) return;
      
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const systemInfo = wx.getSystemInfoSync();
      const dpr = systemInfo.pixelRatio;
      canvas.width = res[0].width * dpr;
      canvas.height = res[0].height * dpr;
      ctx.scale(dpr, dpr);
      
      const dailyStats = this.data.dailyStats;
      const days = Object.keys(dailyStats).sort(); // 使用完整日期排序
      const chartWidth = res[0].width;
      const chartHeight = res[0].height;
    
      // 绘制背景
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, chartWidth, chartHeight);
      
      // 绘制坐标轴
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 1;
      // X轴
      ctx.beginPath();
      ctx.moveTo(40, chartHeight - 40);
      ctx.lineTo(chartWidth - 20, chartHeight - 40);
      ctx.stroke();
      // Y轴
      ctx.beginPath();
      ctx.moveTo(40, 20);
      ctx.lineTo(40, chartHeight - 40);
      ctx.stroke();
      
      // 如果没有数据，显示提示文字
      if (days.length === 0) {
        ctx.fillStyle = '#999';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('暂无日统计数据', chartWidth / 2, chartHeight / 2);
        return;
      }
      
      // 计算最大值
      let maxValue = 0;
      days.forEach(day => {
        const stat = dailyStats[day];
        // 考虑收入和支出的最大值
        const value = Math.max(stat.income, stat.expense);
        if (value > maxValue) {
          maxValue = value;
        }
      });
      
      // 防止除以0
      if (maxValue === 0) maxValue = 1;
      
      // 绘制柱状图
      const barWidth = (chartWidth - 60) / (days.length * 3);
      const gap = barWidth;
      
      days.forEach((day, index) => {
        const stat = dailyStats[day];
        const x = 40 + index * (barWidth * 2 + gap) + gap;
        
        // 确保金额为正数（如果是支出，取绝对值）
        const incomeValue = Math.abs(stat.income);
        const expenseValue = Math.abs(stat.expense);
        
        // 绘制收入柱
        const incomeHeight = (incomeValue / maxValue) * (chartHeight - 60);
        ctx.fillStyle = '#07c160';
        ctx.fillRect(x, chartHeight - 40 - incomeHeight, barWidth, incomeHeight);
        
        // 绘制支出柱
        const expenseHeight = (expenseValue / maxValue) * (chartHeight - 60);
        ctx.fillStyle = '#ff4d4f';
        ctx.fillRect(x + barWidth, chartHeight - 40 - expenseHeight, barWidth, expenseHeight);
        
        // 绘制日期：只显示日部分
        const dayOfMonth = day.split('-')[2];
        ctx.fillStyle = '#666';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(dayOfMonth + '日', x + barWidth, chartHeight - 20);
      });
      
      // 绘制图例
      ctx.fillStyle = '#07c160';
      ctx.fillRect(40, 10, 10, 10);
      ctx.fillStyle = '#666';
      ctx.font = `${Math.max(10, chartHeight / 20)}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText('收入', 60, 20);
      
      ctx.fillStyle = '#ff4d4f';
      ctx.fillRect(120, 10, 10, 10);
      ctx.fillStyle = '#666';
      ctx.textAlign = 'left';
      ctx.fillText('支出', 140, 20);
      
      // 在Canvas 2D中，确保渲染
      canvas.requestAnimationFrame(() => {});
    });
  },

  // 导出数据到CSV文件
  exportData() {
    const records = wx.getStorageSync('records') || [];
    
    if (records.length === 0) {
      wx.showToast({
        title: '暂无数据可导出',
        icon: 'none'
      });
      return;
    }
    
    // 按月份筛选数据
    const currentMonth = this.data.currentMonth;
    const monthRecords = records.filter(record => {
       return record.date && record.date.startsWith(currentMonth);
     });
    
    if (monthRecords.length === 0) {
      wx.showToast({
        title: '当前月份暂无数据可导出',
        icon: 'none'
      });
      return;
    }
    
    // 构建CSV内容
    let csvContent = '日期,时间,类型,分类,子分类,账户,金额,备注\n';
    
     monthRecords.forEach(record => {
       // 转义特殊字符，同时确保字段存在
       const date = this.escapeCsvField(record.date || '0000-00-00');
       const time = this.escapeCsvField(record.time || '00:00');
       const type = this.escapeCsvField(record.type || '');
       const category = this.escapeCsvField(record.category || '');
       const subcategory = this.escapeCsvField(record.subcategory || '');
      
      // 获取账户信息
      let accountInfo = '';
      if (record.accountName) {
        accountInfo = this.escapeCsvField(`${record.accountIcon || ''} ${record.accountName}`);
      } else {
        // 如果记录中没有账户信息，需要从账户数据中获取
        const accounts = wx.getStorageSync('accounts') || { accounts: [] };
        let allAccounts = [];
        if (accounts.accounts) {
          // 新数据结构：{ accounts: [...] }
          allAccounts = accounts.accounts;
        } else if (accounts.deposit && accounts.liability) {
          // 旧数据结构：{ deposit: [...], liability: [...] }
          allAccounts = [...accounts.deposit, ...accounts.liability];
        }
        const account = allAccounts.find(acc => acc.id === record.accountId);
        accountInfo = this.escapeCsvField(account ? `${account.icon} ${account.name}` : '未知账户');
      }
      
      const amount = this.escapeCsvField(record.amount ? record.amount.toString() : '0');
      const note = this.escapeCsvField(record.note || '');
      
      csvContent += `${date},${time},${type},${category},${subcategory},${accountInfo},${amount},${note}\n`;
    });
    
    // 创建临时文件
    const fs = wx.getFileSystemManager();
    const fileName = `记账数据_${currentMonth}.csv`;
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
    
    try {
      // 在CSV内容前面添加BOM，解决中文乱码问题
      const bom = '\uFEFF';
      const csvWithBom = bom + csvContent;
      
      // 写入文件
      fs.writeFileSync(filePath, csvWithBom, 'utf8');
      
      // 直接使用临时文件路径打开文档，而不是使用wx.saveFile
      wx.openDocument({
        filePath: filePath,
        fileType: 'csv',
        success: () => {
          wx.showToast({
            title: '导出成功',
            icon: 'success'
          });
          console.log('成功打开文档');
        },
        fail: (err) => {
          console.log('打开文档失败', err);
          wx.showToast({
            title: '导出失败',
            icon: 'none'
          });
        }
      });
    } catch (error) {
      console.error('写入文件失败', error);
      wx.showToast({
        title: '导出失败',
        icon: 'none'
      });
    }
  },

   // 转义CSV字段中的特殊字符
   escapeCsvField(field) {
     field = String(field || '');
     // 如果字段包含逗号、双引号或换行符，则用双引号包围，并将双引号转义为两个双引号
     if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
       return `"${field.replace(/"/g, '""')}"`;
     }
     return field;
   }
});