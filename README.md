# C酱吧数据分析面板

C酱吧（百度贴吧）数据分析可视化面板，基于 Streamlit + Plotly 构建。

## 功能

- **多维度筛选**：数据来源、帖子主题、情绪标签、提及产品、回复意图、时间范围
- **概览面板**：指标卡片、主题分布、情绪分布、产品提及热度、回复意图分布
- **发帖分析**：月度趋势、时段分布、主题互动率对比、内容长度 vs 互动散点图、高质量帖子排行
- **回复分析**：产品属性关注度、各产品情绪分布、楼层回复 vs 楼中楼情绪对比、属性×情绪热力图、高赞回复排行
- **内容搜索**：帖子/回复关键词搜索、带标签的完整内容表格

## 数据

- `main.csv` — 主帖数据（3,436 条）
- `reply.csv` — 楼层回复数据（21,507 条）
- `lzl.csv` — 楼中楼数据（10,759 条）

## 本地运行

```bash
pip install -r requirements.txt
streamlit run dashboard.py
```

## 部署到 Streamlit Cloud

1. Fork 本仓库到你的 GitHub 账号
2. 访问 [share.streamlit.io](https://share.streamlit.io)
3. 点击 **New app**，选择本仓库
4. 主文件路径填 `dashboard.py`
5. 点击 **Deploy**

## 数据更新

替换仓库中的 `main.csv`、`reply.csv`、`lzl.csv` 后重新部署即可。
