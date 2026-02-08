#!/usr/bin/env python3
"""
Smart Dispatch Rules - 自动化登录测试
使用 Selenium 模拟浏览器测试登录功能
"""

import time
import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

def test_login():
    """测试登录流程"""
    
    # 配置 Chrome 选项
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # 无头模式
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    
    print("🚀 启动浏览器...")
    
    try:
        # 启动浏览器
        driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()),
            options=chrome_options
        )
        
        # 测试的网址
        url = "https://web-blond-chi-83.vercel.app"
        
        print(f"🌐 访问网站: {url}")
        driver.get(url)
        
        # 等待页面加载
        print("⏳ 等待页面加载...")
        time.sleep(5)
        
        # 截图查看初始状态
        driver.save_screenshot("screenshot_1_initial.png")
        print("📸 截图已保存: screenshot_1_initial.png")
        
        # 检查是否在登录页面
        print("🔍 检查页面内容...")
        page_source = driver.page_source
        
        if "login" in page_source.lower() or "登录" in page_source:
            print("✅ 检测到登录页面")
        else:
            print("⚠️ 可能不是登录页面，检查当前URL:")
            print(f"   当前URL: {driver.current_url}")
        
        # 查找用户名输入框
        print("🔍 查找用户名输入框...")
        try:
            username_input = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='text'], input[placeholder*='用户名'], input[placeholder*='username']"))
            )
            print("✅ 找到用户名输入框")
        except:
            # 尝试其他选择器
            try:
                username_input = driver.find_element(By.ID, "username")
                print("✅ 找到用户名输入框 (by ID)")
            except:
                # 列出所有输入框
                inputs = driver.find_elements(By.TAG_NAME, "input")
                print(f"⚠️ 找到 {len(inputs)} 个输入框")
                for i, inp in enumerate(inputs):
                    print(f"   输入框 {i}: type={inp.get_attribute('type')}, placeholder={inp.get_attribute('placeholder')}")
                
                if len(inputs) >= 1:
                    username_input = inputs[0]
                    print("使用第一个输入框作为用户名")
                else:
                    raise Exception("没有找到输入框")
        
        # 查找密码输入框
        print("🔍 查找密码输入框...")
        try:
            password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
            print("✅ 找到密码输入框")
        except:
            inputs = driver.find_elements(By.TAG_NAME, "input")
            for inp in inputs:
                if inp.get_attribute("type") == "password":
                    password_input = inp
                    print("✅ 找到密码输入框 (遍历)")
                    break
            else:
                raise Exception("没有找到密码输入框")
        
        # 输入用户名和密码
        print("📝 输入用户名和密码...")
        username_input.clear()
        username_input.send_keys("admin")
        
        password_input.clear()
        password_input.send_keys("admin123")
        
        # 截图
        driver.save_screenshot("screenshot_2_filled.png")
        print("📸 截图已保存: screenshot_2_filled.png")
        
        # 查找登录按钮
        print("🔍 查找登录按钮...")
        try:
            login_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit'], button:contains('登录'), button:contains('Login')")
        except:
            # 尝试找包含"登录"或"Login"文本的按钮
            buttons = driver.find_elements(By.TAG_NAME, "button")
            print(f"⚠️ 找到 {len(buttons)} 个按钮")
            for i, btn in enumerate(buttons):
                print(f"   按钮 {i}: text={btn.text}")
            
            if len(buttons) > 0:
                login_button = buttons[0]
                print("使用第一个按钮作为登录按钮")
            else:
                raise Exception("没有找到登录按钮")
        
        # 点击登录
        print("🖱️ 点击登录按钮...")
        login_button.click()
        
        # 等待响应
        print("⏳ 等待登录响应...")
        time.sleep(5)
        
        # 截图
        driver.save_screenshot("screenshot_3_after_login.png")
        print("📸 截图已保存: screenshot_3_after_login.png")
        
        # 检查登录结果
        current_url = driver.current_url
        print(f"🌐 当前URL: {current_url}")
        
        page_source = driver.page_source
        
        # 检查是否登录成功
        success_indicators = ["dashboard", "dashboard", "首页", "logout", "退出", "admin"]
        error_indicators = ["invalid", "error", "错误", "失败", "incorrect"]
        
        is_success = any(indicator in page_source.lower() for indicator in success_indicators)
        is_error = any(indicator in page_source.lower() for indicator in error_indicators)
        
        if is_success and not is_error:
            print("✅ 登录成功！")
            result = "SUCCESS"
        elif is_error:
            print("❌ 登录失败！")
            # 提取错误信息
            print("页面内容片段:")
            print(page_source[:1000])
            result = "FAILED"
        else:
            print("⚠️ 无法确定登录状态")
            print("页面内容片段:")
            print(page_source[:1000])
            result = "UNKNOWN"
        
        # 关闭浏览器
        driver.quit()
        
        return result
        
    except Exception as e:
        print(f"❌ 测试出错: {e}")
        try:
            driver.save_screenshot("screenshot_error.png")
            print("📸 错误截图已保存: screenshot_error.png")
            driver.quit()
        except:
            pass
        return "ERROR"


if __name__ == "__main__":
    print("=" * 60)
    print("Smart Dispatch Rules - 登录测试")
    print("=" * 60)
    print()
    
    result = test_login()
    
    print()
    print("=" * 60)
    print(f"测试结果: {result}")
    print("=" * 60)
    
    sys.exit(0 if result == "SUCCESS" else 1)
