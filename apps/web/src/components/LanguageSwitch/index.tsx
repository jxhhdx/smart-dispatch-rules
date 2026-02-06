import React from 'react';
import { Dropdown, Button, Space } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { supportedLanguages, changeLanguage } from '../../i18n';

const LanguageSwitch: React.FC<{ type?: 'dropdown' | 'button' }> = ({ type = 'dropdown' }) => {
  const { i18n } = useTranslation();
  const resolvedLanguage = i18n.resolvedLanguage || i18n.language || '';
  const isActiveLanguage = (key: string) => {
    const base = key.split('-')[0];
    return resolvedLanguage === key || resolvedLanguage.startsWith(base);
  };
  const currentLang = supportedLanguages.find(l => isActiveLanguage(l.key)) || supportedLanguages[0];

  const handleChange = (key: string) => {
    changeLanguage(key);
    // 刷新页面以应用新的语言设置
    window.location.reload();
  };

  const items = supportedLanguages.map(lang => ({
    key: lang.key,
    label: (
      <Space>
        <span>{lang.flag}</span>
        <span>{lang.label}</span>
      </Space>
    ),
    onClick: () => handleChange(lang.key),
  }));

  if (type === 'button') {
    return (
      <Space>
        {supportedLanguages.map(lang => (
          <Button
            key={lang.key}
            type={isActiveLanguage(lang.key) ? 'primary' : 'default'}
            size="small"
            onClick={() => handleChange(lang.key)}
          >
            {lang.flag} {lang.label}
          </Button>
        ))}
      </Space>
    );
  }

  return (
    <Dropdown menu={{ items }} placement="bottomRight">
      <Button 
        type="text" 
        icon={<GlobalOutlined />}
        style={{ color: 'inherit' }}
      >
        {currentLang.flag} {currentLang.label}
      </Button>
    </Dropdown>
  );
};

export default LanguageSwitch;
