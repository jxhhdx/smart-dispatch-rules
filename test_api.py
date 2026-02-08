#!/usr/bin/env python3
"""
Smart Dispatch Rules - API 测试
直接使用 HTTP 请求测试后端 API
"""

import requests
import json
import sys

API_URL = "https://api-three-gamma-52.vercel.app/api/v1"

def test_health():
    """测试 API 是否可访问"""
    print("🏥 测试 API 健康状态...")
    try:
        response = requests.get(f"{API_URL}", timeout=30)
        print(f"   状态码: {response.status_code}")
        print(f"   响应: {response.text[:500]}")
        return True
    except Exception as e:
        print(f"   ❌ 错误: {e}")
        return False

def test_login():
    """测试登录接口"""
    print("\n🔐 测试登录接口...")
    
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(
            f"{API_URL}/auth/login",
            json=login_data,
            headers=headers,
            timeout=30
        )
        
        print(f"   状态码: {response.status_code}")
        print(f"   响应头: {dict(response.headers)}")
        
        try:
            data = response.json()
            print(f"   响应体: {json.dumps(data, indent=2, ensure_ascii=False)}")
        except:
            print(f"   响应文本: {response.text}")
        
        if response.status_code == 200:
            print("   ✅ 登录成功")
            return True
        elif response.status_code == 401:
            print("   ❌ 用户名或密码错误")
            return False
        else:
            print(f"   ⚠️ 意外状态码: {response.status_code}")
            return False
            
    except requests.exceptions.Timeout:
        print("   ⏱️ 请求超时（30秒）")
        return False
    except requests.exceptions.ConnectionError as e:
        print(f"   🔌 连接错误: {e}")
        return False
    except Exception as e:
        print(f"   ❌ 错误: {e}")
        return False

def test_cors():
    """测试 CORS 配置"""
    print("\n🌐 测试 CORS...")
    
    try:
        response = requests.options(
            f"{API_URL}/auth/login",
            headers={
                "Origin": "https://web-blond-chi-83.vercel.app",
                "Access-Control-Request-Method": "POST"
            },
            timeout=10
        )
        
        print(f"   状态码: {response.status_code}")
        cors_headers = {
            "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
            "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods"),
        }
        print(f"   CORS 响应头: {cors_headers}")
        
    except Exception as e:
        print(f"   ⚠️ CORS 测试失败: {e}")

def main():
    print("=" * 60)
    print("Smart Dispatch Rules - API 测试")
    print("=" * 60)
    print(f"API 地址: {API_URL}")
    print()
    
    # 测试健康状态
    health_ok = test_health()
    
    # 测试 CORS
    test_cors()
    
    # 测试登录
    login_ok = test_login()
    
    print()
    print("=" * 60)
    print("测试总结")
    print("=" * 60)
    print(f"API 可访问: {'✅' if health_ok else '❌'}")
    print(f"登录功能: {'✅' if login_ok else '❌'}")
    print()
    
    if login_ok:
        print("🎉 所有测试通过！")
        return 0
    else:
        print("⚠️ 测试未通过，请检查部署配置")
        return 1

if __name__ == "__main__":
    sys.exit(main())
