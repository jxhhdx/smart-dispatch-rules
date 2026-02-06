import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import jaJP from 'antd/locale/ja_JP'
import koKR from 'antd/locale/ko_KR'
import App from './App'
import './i18n' // 引入 i18n 配置
import './index.css'

// 根据当前语言选择 Ant Design 的 locale
const getAntdLocale = () => {
  const lang = localStorage.getItem('i18nextLng') || navigator.language || 'zh-CN'
  if (lang.startsWith('en')) return enUS
  if (lang.startsWith('ja')) return jaJP
  if (lang.startsWith('ko')) return koKR
  return zhCN
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={getAntdLocale()}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>,
)
