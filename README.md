# C酱吧数据洞察仪表板

C酱吧（百度贴吧）数据分析可视化面板，基于 ECharts + 原生 HTML 构建，零依赖、自包含。

## 在线访问

**GitHub Pages**: https://guihuasuancaizi.github.io/coc-tieba-dashboard/

## 功能模块

- **数据概览**：核心指标卡片、月度发帖趋势、内容主题分布、情绪分布、发帖时间热力图
- **发帖分析**：产品 & 属性提及 TOP15、数据源分布、互动率分布
- **回复分析**：情绪趋势、高频关键词分布
- **VOC 洞察**：产品提及量 & 正负向分布、好评率对比、各产品 VOC 详情卡片、关键词频次表

## 数据

- `main.csv` — 主帖数据（3,436 条）
- `reply.csv` — 楼层回复数据（21,507 条）
- `lzl.csv` — 楼中楼数据（10,759 条）
- `voc_summary.csv` — VOC 汇总
- `voc_voices.csv` — VOC 原声
- `voc_words.csv` — VOC 关键词频次

## 本地运行

直接双击 `index.html` 用浏览器打开即可，无需任何服务器或依赖安装。

## 数据更新

替换仓库中的 CSV 文件后，重新运行数据处理脚本更新 `assets/charts.js` 中的嵌入数据即可。
