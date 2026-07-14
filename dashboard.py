import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np
import os

st.set_page_config(page_title="C酱吧数据分析面板", layout="wide", initial_sidebar_state="expanded")

# ============ 样式 ============
st.markdown("""
<style>
    .main-header { font-size: 2rem; font-weight: bold; color: #1f77b4; }
    .metric-card { background: #f0f2f6; border-radius: 10px; padding: 15px; text-align: center; }
    .metric-value { font-size: 1.8rem; font-weight: bold; color: #2c3e50; }
    .metric-label { font-size: 0.9rem; color: #7f8c8d; }
</style>
""", unsafe_allow_html=True)

# ============ 数据加载 ============
@st.cache_data
def load_data():
    data_dir = os.path.dirname(os.path.abspath(__file__))
    main = pd.read_csv(os.path.join(data_dir, 'main.csv'), low_memory=False)
    reply = pd.read_csv(os.path.join(data_dir, 'reply.csv'), low_memory=False)
    lzl = pd.read_csv(os.path.join(data_dir, 'lzl.csv'), low_memory=False)

    # 时间处理
    main['创建时间_dt'] = pd.to_datetime(main['创建时间'], errors='coerce')
    main['发布日期_dt'] = pd.to_datetime(main['发布日期'], errors='coerce')
    reply['发布时间_dt'] = pd.to_datetime(reply['发布时间'], errors='coerce')
    lzl['发布时间_dt'] = pd.to_datetime(lzl['发布时间'], errors='coerce')

    # 数值处理
    for col in ['回复数', '点赞数', '浏览数', '分享数', '互动率', '综合互动得分']:
        if col in main.columns:
            main[col] = pd.to_numeric(main[col], errors='coerce').fillna(0)

    return main, reply, lzl

main_df, reply_df, lzl_df = load_data()

# ============ 侧边栏筛选 ============
st.sidebar.markdown("## 筛选条件")

# 数据来源
source_filter = st.sidebar.multiselect(
    "数据来源",
    options=sorted(main_df['数据来源'].dropna().unique()),
    default=sorted(main_df['数据来源'].dropna().unique())
)

# 是否活动贴
activity_filter = st.sidebar.multiselect(
    "是否活动贴",
    options=['是', '否'],
    default=['否']
)

# 帖子主题
theme_options = sorted(main_df['帖子主题'].dropna().unique())
theme_filter = st.sidebar.multiselect("帖子主题", options=theme_options, default=theme_options)

# 情绪标签
emotion_options = ['正面', '中性', '负面']
emotion_filter = st.sidebar.multiselect("情绪标签", options=emotion_options, default=emotion_options)

# 提及产品
all_products = ['黄油小姐', '可可狼姬', '星梨奈', '诺诺亚', '赤鸢', '猫娘', '蜜桃', '莓莓兔']
product_filter = st.sidebar.multiselect("提及产品", options=all_products, default=[])

# 意图标签（回复）
intent_options = sorted(reply_df['意图标签'].dropna().unique())
intent_filter = st.sidebar.multiselect("回复意图", options=intent_options, default=intent_options)

# 时间范围
min_date = main_df['创建时间_dt'].min().date()
max_date = main_df['创建时间_dt'].max().date()
date_range = st.sidebar.date_input("时间范围", value=(min_date, max_date), min_value=min_date, max_value=max_date)

st.sidebar.markdown("---")
st.sidebar.info("提示：不选择任何条件时，默认展示全部数据。产品筛选为空时不过滤产品。")

# ============ 数据过滤 ============
filtered_main = main_df.copy()

if source_filter:
    filtered_main = filtered_main[filtered_main['数据来源'].isin(source_filter)]
if activity_filter:
    filtered_main = filtered_main[filtered_main['是否活动贴'].isin(activity_filter)]
if theme_filter:
    filtered_main = filtered_main[filtered_main['帖子主题'].isin(theme_filter)]
if emotion_filter:
    filtered_main = filtered_main[filtered_main['情绪标签'].isin(emotion_filter)]

# 产品筛选
if product_filter:
    mask = filtered_main['提及产品'].apply(lambda x: any(p in str(x) for p in product_filter))
    filtered_main = filtered_main[mask]

# 时间筛选
if len(date_range) == 2:
    filtered_main = filtered_main[
        (filtered_main['创建时间_dt'].dt.date >= date_range[0]) &
        (filtered_main['创建时间_dt'].dt.date <= date_range[1])
    ]

# 回复数据同步过滤
filtered_reply = reply_df.copy()
filtered_lzl = lzl_df.copy()
if source_filter:
    filtered_reply = filtered_reply[filtered_reply['数据来源'].isin(source_filter)]
    filtered_lzl = filtered_lzl[filtered_lzl['数据来源'].isin(source_filter)]
if emotion_filter:
    filtered_reply = filtered_reply[filtered_reply['情绪标签'].isin(emotion_filter)]
    filtered_lzl = filtered_lzl[filtered_lzl['情绪标签'].isin(emotion_filter)]
if intent_filter:
    filtered_reply = filtered_reply[filtered_reply['意图标签'].isin(intent_filter)]
    filtered_lzl = filtered_lzl[filtered_lzl['意图标签'].isin(intent_filter)]
if product_filter:
    mask_r = filtered_reply['提及产品'].apply(lambda x: any(p in str(x) for p in product_filter))
    filtered_reply = filtered_reply[mask_r]
    mask_l = filtered_lzl['提及产品'].apply(lambda x: any(p in str(x) for p in product_filter))
    filtered_lzl = filtered_lzl[mask_l]

# ============ 主区域 ============
st.markdown('<div class="main-header">C酱吧数据分析面板</div>', unsafe_allow_html=True)
st.markdown(f"当前筛选条件：主帖 **{len(filtered_main)}** 条 | 楼层回复 **{len(filtered_reply)}** 条 | 楼中楼 **{len(filtered_lzl)}** 条")

# 标签页
tab1, tab2, tab3, tab4 = st.tabs(["概览", "发帖分析", "回复分析", "内容详情"])

# ============ Tab 1: 概览 ============
with tab1:
    # 指标卡片
    col1, col2, col3, col4, col5 = st.columns(5)
    with col1:
        st.markdown(f'<div class="metric-card"><div class="metric-value">{len(filtered_main)}</div><div class="metric-label">主帖数</div></div>', unsafe_allow_html=True)
    with col2:
        st.markdown(f'<div class="metric-card"><div class="metric-value">{len(filtered_reply)}</div><div class="metric-label">楼层回复</div></div>', unsafe_allow_html=True)
    with col3:
        st.markdown(f'<div class="metric-card"><div class="metric-value">{len(filtered_lzl)}</div><div class="metric-label">楼中楼</div></div>', unsafe_allow_html=True)
    with col4:
        avg_interaction = filtered_main['互动率'].mean() if len(filtered_main) > 0 else 0
        st.markdown(f'<div class="metric-card"><div class="metric-value">{avg_interaction:.3f}</div><div class="metric-label">平均互动率</div></div>', unsafe_allow_html=True)
    with col5:
        avg_reply = filtered_main['回复数'].mean() if len(filtered_main) > 0 else 0
        st.markdown(f'<div class="metric-card"><div class="metric-value">{avg_reply:.1f}</div><div class="metric-label">平均回复数</div></div>', unsafe_allow_html=True)

    st.markdown("---")

    col_left, col_right = st.columns(2)

    with col_left:
        # 帖子主题分布
        if len(filtered_main) > 0:
            theme_counts = filtered_main['帖子主题'].value_counts().reset_index()
            theme_counts.columns = ['主题', '数量']
            fig = px.pie(theme_counts, values='数量', names='主题', title='帖子主题分布')
            fig.update_traces(textposition='inside', textinfo='percent+label')
            st.plotly_chart(fig, use_container_width=True)

        # 情绪分布
        if len(filtered_main) > 0:
            emotion_counts = filtered_main['情绪标签'].value_counts().reset_index()
            emotion_counts.columns = ['情绪', '数量']
            color_map = {'正面': '#2ecc71', '中性': '#95a5a6', '负面': '#e74c3c'}
            fig = px.bar(emotion_counts, x='情绪', y='数量', color='情绪', color_discrete_map=color_map, title='主帖情绪分布')
            st.plotly_chart(fig, use_container_width=True)

    with col_right:
        # 产品提及热度
        all_mentions = []
        for text in filtered_main['提及产品']:
            if pd.notna(text) and text:
                all_mentions.extend(text.split('、'))
        for text in filtered_reply['提及产品']:
            if pd.notna(text) and text:
                all_mentions.extend(text.split('、'))

        if all_mentions:
            product_counts = pd.Series(all_mentions).value_counts().reset_index()
            product_counts.columns = ['产品', '提及次数']
            fig = px.bar(product_counts, x='产品', y='提及次数', color='提及次数', title='产品提及热度（主帖+回复）')
            st.plotly_chart(fig, use_container_width=True)

        # 回复意图分布
        if len(filtered_reply) > 0:
            intent_counts = filtered_reply['意图标签'].value_counts().reset_index()
            intent_counts.columns = ['意图', '数量']
            fig = px.bar(intent_counts, x='意图', y='数量', color='意图', title='楼层回复意图分布')
            st.plotly_chart(fig, use_container_width=True)

# ============ Tab 2: 发帖分析 ============
with tab2:
    col1, col2 = st.columns(2)

    with col1:
        # 时间趋势
        if len(filtered_main) > 0:
            filtered_main['月份'] = filtered_main['创建时间_dt'].dt.to_period('M').astype(str)
            monthly = filtered_main.groupby('月份').agg(
                发帖数=('回复数', 'size'),
                总回复=('回复数', 'sum'),
                总点赞=('点赞数', 'sum'),
                总浏览=('浏览数', 'sum')
            ).reset_index()

            fig = make_subplots(specs=[[{"secondary_y": True}]])
            fig.add_trace(go.Bar(x=monthly['月份'], y=monthly['发帖数'], name='发帖数'), secondary_y=False)
            fig.add_trace(go.Scatter(x=monthly['月份'], y=monthly['总回复'], name='总回复', mode='lines+markers'), secondary_y=True)
            fig.update_layout(title='月度发帖趋势', xaxis_tickangle=-45)
            st.plotly_chart(fig, use_container_width=True)

        # 时段分布
        if len(filtered_main) > 0:
            hour_counts = filtered_main['发布小时'].value_counts().sort_index().reset_index()
            hour_counts.columns = ['小时', '发帖数']
            fig = px.bar(hour_counts, x='小时', y='发帖数', title='发帖时段分布')
            st.plotly_chart(fig, use_container_width=True)

    with col2:
        # 主题 vs 互动率
        if len(filtered_main) > 0 and '互动率' in filtered_main.columns:
            theme_interaction = filtered_main.groupby('帖子主题')['互动率'].mean().sort_values(ascending=True).reset_index()
            fig = px.bar(theme_interaction, x='互动率', y='帖子主题', orientation='h', title='各主题平均互动率')
            st.plotly_chart(fig, use_container_width=True)

        # 内容长度 vs 互动
        if len(filtered_main) > 0:
            filtered_main['内容长度'] = filtered_main['内容'].fillna('').astype(str).str.len()
            fig = px.scatter(filtered_main, x='内容长度', y='回复数', color='帖子主题',
                           hover_data=['标题'], title='内容长度 vs 回复数', opacity=0.6)
            st.plotly_chart(fig, use_container_width=True)

    st.markdown("---")
    st.subheader("高质量帖子排行（非活动贴）")

    non_activity = filtered_main[filtered_main['是否活动贴'] == '否'].copy()
    sort_by = st.selectbox("排序方式", ['互动率', '综合互动得分', '回复数', '点赞数', '浏览数'])
    top_n = st.slider("显示数量", 5, 50, 20)

    if len(non_activity) > 0:
        display_cols = ['数据来源', '标题', '帖子主题', '回复数', '点赞数', '浏览数', '互动率', '综合互动得分', '提及产品', '情绪标签']
        display_cols = [c for c in display_cols if c in non_activity.columns]
        top_posts = non_activity.nlargest(top_n, sort_by)[display_cols]
        st.dataframe(top_posts, use_container_width=True)

# ============ Tab 3: 回复分析 ============
with tab3:
    col1, col2 = st.columns(2)

    with col1:
        # 产品属性关注度
        all_attrs = []
        for text in filtered_main['产品属性标签']:
            if pd.notna(text) and text:
                all_attrs.extend(text.split('、'))
        for text in filtered_reply['产品属性标签']:
            if pd.notna(text) and text:
                all_attrs.extend(text.split('、'))

        if all_attrs:
            attr_counts = pd.Series(all_attrs).value_counts().reset_index()
            attr_counts.columns = ['属性', '提及次数']
            fig = px.bar(attr_counts, x='属性', y='提及次数', color='提及次数', title='产品属性关注度')
            st.plotly_chart(fig, use_container_width=True)

        # 各产品情绪分布
        product_emotion_data = []
        for _, row in filtered_reply.iterrows():
            products = str(row['提及产品']).split('、') if pd.notna(row['提及产品']) and row['提及产品'] else []
            for p in products:
                if p in all_products:
                    product_emotion_data.append({'产品': p, '情绪': row['情绪标签']})

        if product_emotion_data:
            pe_df = pd.DataFrame(product_emotion_data)
            pe_counts = pe_df.groupby(['产品', '情绪']).size().reset_index(name='数量')
            fig = px.bar(pe_counts, x='产品', y='数量', color='情绪', barmode='group',
                        color_discrete_map={'正面': '#2ecc71', '中性': '#95a5a6', '负面': '#e74c3c'},
                        title='各产品回复情绪分布')
            st.plotly_chart(fig, use_container_width=True)

    with col2:
        # 楼中楼 vs 楼层回复 情绪对比
        reply_emotion = filtered_reply['情绪标签'].value_counts().reset_index()
        reply_emotion.columns = ['情绪', '数量']
        reply_emotion['类型'] = '楼层回复'
        lzl_emotion = filtered_lzl['情绪标签'].value_counts().reset_index()
        lzl_emotion.columns = ['情绪', '数量']
        lzl_emotion['类型'] = '楼中楼'
        combined_emotion = pd.concat([reply_emotion, lzl_emotion])
        fig = px.bar(combined_emotion, x='情绪', y='数量', color='类型', barmode='group',
                    title='楼层回复 vs 楼中楼 情绪对比')
        st.plotly_chart(fig, use_container_width=True)

        # 产品属性 vs 情绪（热力图）
        attr_emotion_data = []
        for _, row in filtered_reply.iterrows():
            attrs = str(row['产品属性标签']).split('、') if pd.notna(row['产品属性标签']) and row['产品属性标签'] else []
            for a in attrs:
                attr_emotion_data.append({'属性': a, '情绪': row['情绪标签']})

        if attr_emotion_data:
            ae_df = pd.DataFrame(attr_emotion_data)
            ae_pivot = ae_df.groupby(['属性', '情绪']).size().unstack(fill_value=0)
            fig = px.imshow(ae_pivot, text_auto=True, aspect="auto", title='产品属性 × 情绪 热力图')
            st.plotly_chart(fig, use_container_width=True)

    st.markdown("---")
    st.subheader("高赞回复排行")
    sort_reply_by = st.selectbox("回复排序方式", ['点赞数', '楼中楼数'], key='reply_sort')
    top_reply_n = st.slider("显示数量", 5, 50, 20, key='reply_n')

    if len(filtered_reply) > 0:
        reply_display_cols = ['数据来源', '内容', '点赞数', '楼中楼数', '情绪标签', '意图标签', '提及产品', '产品属性标签']
        reply_display_cols = [c for c in reply_display_cols if c in filtered_reply.columns]
        top_replies = filtered_reply.nlargest(top_reply_n, sort_reply_by)[reply_display_cols]
        st.dataframe(top_replies, use_container_width=True)

# ============ Tab 4: 内容详情 ============
with tab4:
    st.subheader("帖子搜索")
    search_text = st.text_input("搜索关键词（标题/内容）", "")

    if search_text:
        mask = (
            filtered_main['标题'].fillna('').astype(str).str.contains(search_text, case=False, na=False) |
            filtered_main['内容'].fillna('').astype(str).str.contains(search_text, case=False, na=False)
        )
        search_results = filtered_main[mask]
    else:
        search_results = filtered_main

    st.write(f"共 {len(search_results)} 条结果")

    display_cols_detail = ['数据来源', '标题', '内容', '帖子主题', '是否活动贴', '回复数', '点赞数', '浏览数', '情绪标签', '提及产品', '产品属性标签', '创建时间']
    display_cols_detail = [c for c in display_cols_detail if c in search_results.columns]
    st.dataframe(search_results[display_cols_detail].head(100), use_container_width=True)

    st.markdown("---")
    st.subheader("回复搜索")
    search_reply_text = st.text_input("搜索回复关键词", "", key='reply_search')

    if search_reply_text:
        mask_r = filtered_reply['内容'].fillna('').astype(str).str.contains(search_reply_text, case=False, na=False)
        search_reply_results = filtered_reply[mask_r]
    else:
        search_reply_results = filtered_reply

    st.write(f"共 {len(search_reply_results)} 条结果")
    reply_detail_cols = ['数据来源', '内容', '点赞数', '楼中楼数', '情绪标签', '意图标签', '提及产品', '产品属性标签']
    reply_detail_cols = [c for c in reply_detail_cols if c in search_reply_results.columns]
    st.dataframe(search_reply_results[reply_detail_cols].head(100), use_container_width=True)
