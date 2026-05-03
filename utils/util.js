// 工具函数库

const formatNumber = n => {
  n = n.toString();
  return n[1] ? n : '0' + n;
};

/**
 * 格式化日期
 * @param {Date|String|Number} date 
 * @param {String} format 'YYYY-MM-DD' or 'YYYY-MM-DD HH:mm'
 */
const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = formatNumber(d.getMonth() + 1);
  const day = formatNumber(d.getDate());
  const hour = formatNumber(d.getHours());
  const minute = formatNumber(d.getMinutes());
  
  if (format === 'YYYY-MM-DD HH:mm') {
    return `${year}-${month}-${day} ${hour}:${minute}`;
  }
  return `${year}-${month}-${day}`;
};

/**
 * 获取当前日期字符串 (YYYY-MM-DD)
 */
const getCurrentDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${formatNumber(d.getMonth() + 1)}-${formatNumber(d.getDate())}`;
};

/**
 * 获取当前时间字符串 (HH:mm)
 */
const getCurrentTime = () => {
  const d = new Date();
  return `${formatNumber(d.getHours())}:${formatNumber(d.getMinutes())}`;
};

/**
 * 格式化金额，保留两位小数
 * @param {Number|String} amount 
 */
const formatMoney = amount => {
  const num = parseFloat(amount);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

/**
 * 根据分类名称获取对应的图标
 * @param {String} name 
 * @param {String} type 'income', 'expense', 'subcategory'
 */
const getCategoryIcon = (name, type) => {
  const { CATEGORY_ICONS } = require('../config/constants');
  if (type === 'income' || type === 'expense') {
    return CATEGORY_ICONS[type][name] || (type === 'income' ? '💰' : '💸');
  }
  return CATEGORY_ICONS.subcategory[name] || CATEGORY_ICONS.subcategory['默认'];
};

/**
 * 生成唯一 ID (基于时间戳)
 */
const generateId = () => {
  return Date.now();
};

module.exports = {
  formatNumber,
  formatDate,
  getCurrentDate,
  getCurrentTime,
  formatMoney,
  getCategoryIcon,
  generateId
};
