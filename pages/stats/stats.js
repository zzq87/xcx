// stats.js
Page({
  data: {
    currentMonth: '',
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    categoryStats: {},
    subcategoryStats: {},
    dailyStats: {},
    chartType: 'category' // category 或 subcategory
  },

  onLoad() {
    this.initCurrentMonth();
    this.loadStatsData();
  },

  onShow() {
    this.loadStatsData();
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

  // 加载统计数据
  loadStatsData() {
    const records = wx.getStorageSync('records') || [];
    const currentMonth = this.data.currentMonth;
    
    // 筛选本月记录
    const monthRecords = records.filter(record => {
      return record.date.startsWith(currentMonth);
    });
    
    // 计算总收入和总支出
    let totalIncome = 0;
    let totalExpense = 0;
    
    // 分类统计
    const categoryStats = {};
    // 子分类统计
    const subcategoryStats = {};
    // 日统计
    const dailyStats = {};
    
    monthRecords.forEach(record => {
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
      
      // 日统计
      const day = record.date.split('-')[2];
      if (!dailyStats[day]) {
        dailyStats[day] = { income: 0, expense: 0 };
      }
      dailyStats[day][record.type === '收入' ? 'income' : 'expense'] += record.amount;
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
    query.select('#categoryChart').boundingClientRect();
    query.exec((res) => {
      if (!res || !res[0]) return;
      
      const ctx = wx.createCanvasContext('categoryChart');
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
      ctx.draw();
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
      
      // 绘制收入柱
      const incomeHeight = (stat.income / maxValue) * (chartHeight - 60);
      ctx.fillStyle = '#07c160';
      ctx.fillRect(x, chartHeight - 40 - incomeHeight, barWidth, incomeHeight);
      
      // 绘制支出柱
      const expenseHeight = (stat.expense / maxValue) * (chartHeight - 60);
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
    ctx.fillText('支出', 140, 20);
    
    ctx.draw();
    });
  },

  // 绘制日统计图表
  drawDailyChart() {
    const query = wx.createSelectorQuery();
    query.select('#dailyChart').boundingClientRect();
    query.exec((res) => {
      if (!res || !res[0]) return;
      
      const ctx = wx.createCanvasContext('dailyChart');
      const dailyStats = this.data.dailyStats;
      const days = Object.keys(dailyStats).sort((a, b) => parseInt(a) - parseInt(b));
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
      ctx.draw();
      return;
    }
    
    // 计算最大值
    let maxValue = 0;
    days.forEach(day => {
      const stat = dailyStats[day];
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
      
      // 绘制收入柱
      const incomeHeight = (stat.income / maxValue) * (chartHeight - 60);
      ctx.fillStyle = '#07c160';
      ctx.fillRect(x, chartHeight - 40 - incomeHeight, barWidth, incomeHeight);
      
      // 绘制支出柱
      const expenseHeight = (stat.expense / maxValue) * (chartHeight - 60);
      ctx.fillStyle = '#ff4d4f';
      ctx.fillRect(x + barWidth, chartHeight - 40 - expenseHeight, barWidth, expenseHeight);
      
      // 绘制日期
      ctx.fillStyle = '#666';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(day + '日', x + barWidth, chartHeight - 20);
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
    ctx.fillText('支出', 140, 20);
    
    ctx.draw();
    });
  }
})