#  红柚起始页

一个简洁、美观、功能丰富的浏览器起始页，让你的每次打开浏览器都是一次愉悦的体验。
<a href="https://ibb.co/zWP6NPwH"><img src="https://i.ibb.co/Ps1Dt18z/1.png" alt="1" border="0"></a>

##  特色功能

###  昼夜模式切换
- 精美的动画切换效果
- 太阳/月亮/星星/云朵动画
- 自动适配系统主题
- 流畅的过渡动画

###  快速链接
- 自定义常用网站
- 自动获取网站 Favicon
- 拖拽排序（即将支持）
- 卡片式布局

###  收藏夹管理
- 侧边栏收藏夹
- 导入/导出书签（支持 HTML 和 JSON 格式）
- 搜索书签功能
- 自动获取网站图标

###  背景自定义
- 8 种预设渐变背景
- 自定义上传本地图片
- 支持图片 URL
- 拖拽上传支持
- 背景位置和大小调整

##  快速开始

### 方法一：直接使用
1. 下载本项目的所有文件
2. 用浏览器打开 `index.html` 文件
3. 开始使用！

### 方法二：设为浏览器起始页

#### Chrome / Edge
1. 打开浏览器设置
2. 找到"启动时"选项
3. 选择"打开特定网页或一组网页"
4. 添加本地文件路径：`file:///你的路径/index.html`

#### Firefox
1. 打开浏览器设置
2. 找到"主页"选项
3. 在"主页和新窗口"中选择"自定义网址"
4. 输入本地文件路径：`file:///你的路径/index.html`

### 方法三：部署到服务器
```bash
# 克隆项目
git clone https://github.com/rojim666/index.git

# 部署到任意静态网站服务器
# 例如：GitHub Pages, Vercel, Netlify 等
```

##  使用指南

### 编辑快速链接
1. 点击右上角的"书签"按钮
2. 在弹出的对话框中添加、编辑或删除链接
3. 点击"保存"按钮

### 切换昼夜模式
- 点击左上角的太阳/月亮切换按钮
- 或使用键盘快捷键（如果已配置）

### 更换背景
1. 点击左上角的背景设置图标
2. 选择预设背景或上传自定义图片
3. 可以拖拽图片到上传区域
4. 调整背景的显示方式（填充/适应/原始）

### 管理收藏夹
1. 点击左上角的收藏夹图标
2. 在侧边栏中管理你的书签
3. 可以导入浏览器的书签文件
4. 支持搜索和快速访问

##  技术栈

- **HTML5** - 结构
- **CSS3** - 样式和动画
- **JavaScript** - 交互逻辑
- **LocalStorage** - 数据持久化

##  项目结构

```
index/
├── index.html          # 主页面
├── styles.css          # 样式文件
├── script.js           # 脚本文件
├── _logo.svg           # 网站图标
└── README.md           # 说明文档
```

##  自定义配置

### 修改默认链接
编辑 `script.js` 文件中的 `defaultLinks` 数组：

```javascript
const defaultLinks = [
  {title: 'GitHub', url: 'https://github.com'},
  {title: 'Gmail', url: 'https://mail.google.com'},
  // 添加你的链接...
];
```

### 修改颜色主题
编辑 `styles.css` 文件中的 CSS 变量：

```css
:root {
  --bg: linear-gradient(135deg,#f6f9ff,#eaf2ff);
  --text: #0f1720;
  --accent: #2563eb;
  /* 更多变量... */
}
```

### 添加预设背景
在 `script.js` 中的 `presetBackgrounds` 数组添加：

```javascript
const presetBackgrounds = [
  { id: 'custom1', name: '自定义名称', type: 'gradient', value: 'linear-gradient(...)' },
  // 更多背景...
];
```

##  特性说明

### 数据存储
- 所有数据都存储在浏览器的 LocalStorage 中
- 包括：快速链接、收藏夹、搜索历史、主题设置等
- 数据不会上传到服务器，完全本地化

### 性能优化
- 纯静态页面，加载速度快
- 图片懒加载
- CSS 动画硬件加速
- 响应式设计，适配各种屏幕

##  更新日志

### v1.0.0 (2025-10-14)
-  初始版本发布
-  昼夜模式切换
-  收藏夹系统
-  背景自定义

##  许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

##  致谢

- 昼夜切换按钮灵感来自 [jh3y](https://codepen.io/jh3y) 的 CodePen 作品
- 图标来自 SVG 手绘

##  联系方式

- GitHub: [@rojim666](https://github.com/rojim666)
- 项目地址: [https://github.com/rojim666/index](https://github.com/rojim666/index)

##  Star History

如果这个项目对你有帮助，请给它一个星标！

---

**享受你的红柚起始页！** 🍊
