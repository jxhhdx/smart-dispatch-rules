import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import jaJP from 'antd/locale/ja_JP'
import koKR from 'antd/locale/ko_KR'
import App from './App'
import './i18n'
import './index.css'

// 根据当前语言选择 Ant Design 的 locale
const getAntdLocale = () => {
  const lang = localStorage.getItem('i18nextLng') || navigator.language || 'zh-CN'
  if (lang.startsWith('en')) return enUS
  if (lang.startsWith('ja')) return jaJP
  if (lang.startsWith('ko')) return koKR
  return zhCN
}

// Ant Design 主题配置
const antdTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    // 品牌色 - 保持 Ant Design 默认蓝色
    colorPrimary: '#1677ff',
    colorPrimaryHover: '#4096ff',
    colorPrimaryActive: '#0958d9',
    
    // 功能色
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#f5222d',
    colorInfo: '#1677ff',
    
    // 中性色
    colorText: 'rgba(0, 0, 0, 0.88)',
    colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
    colorTextTertiary: 'rgba(0, 0, 0, 0.45)',
    colorBorder: '#d9d9d9',
    
    // 圆角
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    
    // 阴影
    boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
    
    // 字体
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Layout: {
      headerHeight: 64,
      headerPadding: '0 24px',
    },
    Card: {
      paddingLG: 24,
    },
    Table: {
      padding: 16,
      paddingSM: 8,
      paddingXS: 8,
    },
  },
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider theme={antdTheme} locale={getAntdLocale()}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>,
)
