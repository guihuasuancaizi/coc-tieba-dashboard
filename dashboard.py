import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np
import os

# ============================================================
# 全局配置 & 主题色
# ============================================================
THEME = {
    'primary': '#2196F3',
    'primary_light': '#64B5F6',
    'primary_lighter': '#BBDEFB',
    'primary_bg': '#E3F2FD',
    'surface': '#FFFFFF',
    'background': '#F5F7FA',
    'text': '#2C3E50',
    'text_secondary': '#607D8B',
    'success': '#4CAF50',
    'warning': '#FF9800',
    'danger': '#F44336',
    'border': '#E0E0E0',
}

st.set_page_config(
    page_title="C酱吧数据洞察",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(f"""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    html, body, [class*="css"] {{
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        color: {THEME['text']};
    }}

    .stApp {{
        background: {THEME['background']};
    }}

    /* 侧边栏 */
    section[data-testid="stSidebar"] {{
        background: {THEME['surface']};
        border-right: 1px solid {THEME['border']};
    }}
    section[data-testid="stSidebar"] .css-1cypcdb {{
        background: {THEME['surface']};
    }}
    section[data-testid="stSidebar"] h1, section[data-testid="stSidebar"] h2, section[data-testid="stSidebar"] h3 {{
        color: {THEME['primary']};
        font-weight: 600;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }}

    /* 标签页 */
    .stTabs [data-baseweb="tab-list"] {{
        gap: 0px;
        border-bottom: 2px solid {THEME['border']};
    }}
    .stTabs [data-baseweb="tab"] {{
        padding: 12px 20px;
        font-weight: 500;
        font-size: 0.85rem;
        color: {THEME['text_secondary']};
        border: none;
        border-bottom: 2px solid transparent;
        transition: all 0.2s ease;
    }}
    .stTabs [data-baseweb="tab"]:hover {{
        color: {THEME['primary']};
        background: {THEME['primary_bg']};
    }}
    .stTabs [aria-selected="true"] {{
        color: {THEME['primary']} !important;
        border-bottom: 2px solid {THEME['primary']} !important;
        font-weight: 600;
    }}

    /* 指标卡片 */
    .metric-card {{
        background: {THEME['surface']};
        border-radius: 12px;
        padding: 20px;
        border: 1px solid {THEME['border']};
        box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        transition: all 0.2s ease;
    }}
    .metric-card:hover {{
        box-shadow: 0 4px 12px rgba(33,150,243,0.08);
        border-color: {THEME['primary_lighter']};
    }}
    .metric-value {{
        font-size: 2rem;
        font-weight: 700;
        color: {THEME['primary']};
        line-height: 1.2;
    }}
    .metric-label {{
        font-size: 0.75rem;
        color: {THEME['text_secondary']};
        margin-top: 4px;
        letter-spacing: 0.03em;
        text-transform: uppercase;
    }}
    .metric-delta {{
        font-size: 0.8rem;
        margin-top: 6px;
    }}
    .metric-delta.pos {{ color: {THEME['success']}; }}
    .metric-delta.neg {{ color: {THEME['danger']}; }}

    /* 区块标题 */
    .section-title {{
        font-size: 1rem;
        font-weight: 600;
        color: {THEME['text']};
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 2px solid {THEME['primary_bg']};
        display: flex;
        align-items: center;
        gap: 8px;
    }}
    .section-title::before {{
        content: '';
        display: inline-block;
        width: 4px;
        height: 18px;
        background: {THEME['primary']};
        border-radius: 2px;
    }}

    /* 信息卡片 */
    .info-card {{
        background: {THEME['surface']};
        border-radius: 10px;
        padding: 16px;
        border-left: 3px solid {THEME['primary']};
        box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        margin-bottom: 12px;
    }}
    .info-card.positive {{ border-left-color: {THEME['success']}; }}
    .info-card.negative {{ border-left-color: {THEME['danger']}; }}
    .info-card.neutral {{ border-left-color: {THEME['text_secondary']}; }}

    /* 数据表格 */
    .dataframe {{
        border-radius: 10px;
        overflow: hidden;
        border: 1px solid {THEME['border']};
    }}
    .dataframe th {{
        background: {THEME['primary_bg']};
        color: {THEME['primary']};
        font-weight: 600;
        font-size: 0.8rem;
    }}
    .dataframe td {{
        font-size: 0.85rem;
    }}

    /* 隐藏默认装饰 */
    .stDeployButton {{ display: none !important; }}
    footer {{ visibility: hidden; }}
    #MainMenu {{ visibility: hidden; }}

    /* 按钮美化 */
    .stButton > button {{
        border-radius: 8px;
        font-weight: 500;
        transition: all 0.2s ease;
    }}
    .stButton > button:hover {{
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(33,150,243,0.2);
    }}
</style>
""", unsafe_allow_html=True)

# ============================================================
# 数据加载
# ============================================================
@st.cache_data
def load_data():
    data_dir = os.path.dirname(os.path.abspath(__file__))
    main = pd.read_csv(os.path.join(data_dir, 'main.csv'), low_memory=False)
    reply = pd.read_csv(os.path.join(data_dir, 'reply.csv'), low_memory=False)
    lzl = pd.read_csv(os.path.join(data_dir, 'lzl.csv'), low_memory=False)
    voc_summary = pd.read_csv(os.path.join(data_dir, 'voc_summary.csv'))
    voc_voices = pd.read_csv(os.path.join(data_dir, 'voc_voices.csv'))
    voc_words = pd.read_csv(os.path.join(data_dir, 'voc_words.csv'))

    main['创建时间_dt'] = pd.to_datetime(main['创建时间'], errors='coerce')
    main['发布日期_dt'] = pd.to_datetime(main['发布日期'], errors='coerce')
    reply['发布时间_dt'] = pd.to_datetime(reply['发布时间'], errors='coerce')
    lzl['发布时间_dt'] = pd.to_datetime(lzl['发布时间'], errors='coerce')

    for col in ['回复数', '点赞数', '浏览数', '分享数', '互动率', '综合互动得分']:
        if col in main.columns:
            main[col] = pd.to_numeric(main[col], errors='coerce').fillna(0)
    reply['点赞数'] = pd.to_numeric(reply['点赞数'], errors='coerce').fillna(0)
    lzl['点赞数'] = pd.to_numeric(lzl['点赞数'], errors='coerce').fillna(0)

    return main, reply, lzl, voc_summary, voc_voices, voc_words

main_df, reply_df, lzl_df, voc_summary, voc_voices, voc_words = load_data()

# ============================================================
# 图表配色配置
# ============================================================
BLUE_PALETTE = ['#1976D2', '#2196F3', '#64B5F6', '#90CAF9', '#BBDEFB', '#E3F2FD']
EMOTION_COLORS = {'正面': '#4CAF50', '中性': '#90A4AE', '负面': '#EF5350'}
PIE_COLORS = ['#2196F3', '#64B5F6', '#90CAF9', '#BBDEFB', '#E3F2FD', '#1976D2', '#42A5F5', '#1E88E5']

def style_chart(fig, title, height=None):
    fig.update_layout(
        title=dict(text=f'<b>{title}</b>', font=dict(size=14, color=THEME['text'])),
        font=dict(family='Inter, sans-serif', color=THEME['text']),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        margin=dict(l=20, r=20, t=50, b=20),
        legend=dict(
            orientation='h', yanchor='bottom', y=-0.2, xanchor='center', x=0.5,
            font=dict(size=11)
        ),
    )
    if height:
        fig.update_layout(height=height)
    fig.update_xaxes(
        showgrid=True, gridwidth=1, gridcolor='rgba(0,0,0,0.04)',
        zeroline=False, tickfont=dict(size=11, color=THEME['text_secondary'])
    )
    fig.update_yaxes(
        showgrid=True, gridwidth=1, gridcolor='rgba(0,0,0,0.04)',
        zeroline=False, tickfont=dict(size=11, color=THEME['text_secondary'])
    )
    return fig

# ============================================================
# 侧边栏筛选
# ============================================================
with st.sidebar:
    st.markdown("### 筛选条件")
    st.markdown("<hr style='margin: 12px 0; border: none; border-top: 1px solid #E0E0E0;'>", unsafe_allow_html=True)

    source_filter = st.multiselect(
        "数据来源", options=sorted(main_df['数据来源'].dropna().unique()),
        default=sorted(main_df['数据来源'].dropna().unique()),
        label_visibility='collapsed'
    )
    st.caption("数据来源")

    activity_filter = st.multiselect(
        "是否活动贴", options=['是', '否'], default=['否'],
        label_visibility='collapsed'
    )
    st.caption("是否活动贴")

    theme_options = sorted(main_df['帖子主题'].dropna().unique())
    theme_filter = st.multiselect("帖子主题", options=theme_options, default=theme_options)

    emotion_options = ['正面', '中性', '负面']
    emotion_filter = st.multiselect("情绪标签", options=emotion_options, default=emotion_options)

    all_products = ['黄油小姐', '可可狼姬', '星梨奈', '诺诺亚', '赤鸢', '猫娘', '蜜桃', '莓莓兔']
    product_filter = st.multiselect("提及产品", options=all_products, default=[])

    intent_options = sorted(reply_df['意图标签'].dropna().unique())
    intent_filter = st.multiselect("回复意图", options=intent_options, default=intent_options)

    min_date = main_df['创建时间_dt'].min().date()
    max_date = main_df['创建时间_dt'].max().date()
    date_range = st.date_input("时间范围", value=(min_date, max_date), min_value=min_date, max_value=max_date)

    st.markdown("<hr style='margin: 16px 0; border: none; border-top: 1px solid #E0E0E0;'>", unsafe_allow_html=True)
    st.markdown(f"<div style='font-size: 0.75rem; color: {THEME['text_secondary']};'>不选择任何条件时，默认展示全部数据。<br>产品筛选为空时不过滤产品。</div>", unsafe_allow_html=True)

# ============================================================
# 数据过滤
# ============================================================
filtered_main = main_df.copy()
if source_filter:
    filtered_main = filtered_main[filtered_main['数据来源'].isin(source_filter)]
if activity_filter:
    filtered_main = filtered_main[filtered_main['是否活动贴'].isin(activity_filter)]
if theme_filter:
    filtered_main = filtered_main[filtered_main['帖子主题'].isin(theme_filter)]
if emotion_filter:
    filtered_main = filtered_main[filtered_main['情绪标签'].isin(emotion_filter)]
if product_filter:
    mask = filtered_main['提及产品'].apply(lambda x: any(p in str(x) for p in product_filter))
    filtered_main = filtered_main[mask]
if len(date_range) == 2:
    filtered_main = filtered_main[
        (filtered_main['创建时间_dt'].dt.date >= date_range[0]) &
        (filtered_main['创建时间_dt'].dt.date <= date_range[1])
    ]

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

# ============================================================
# 页面头部
# ============================================================
col_header, col_stats = st.columns([2, 3])
with col_header:
    st.markdown("""
    <div style="margin-bottom: 8px;">
        <span style="font-size: 1.6rem; font-weight: 700; color: #1976D2;">C酱吧</span>
        <span style="font-size: 1.6rem; font-weight: 300; color: #607D8B;">数据洞察</span>
    </div>
    <div style="font-size: 0.8rem; color: #90A4AE; margin-bottom: 16px;">
        C酱1区 & C酱2区 发帖 / 回复 / 楼中楼 综合分析面板
    </div>
    """, unsafe_allow_html=True)

with col_stats:
    c1, c2, c3, c4, c5 = st.columns(5)
    metrics = [
        (len(filtered_main), "主帖", "posts"),
        (len(filtered_reply), "楼层回复", "replies"),
        (len(filtered_lzl), "楼中楼", "nested"),
        (f"{filtered_main['互动率'].mean():.3f}", "平均互动率", "rate"),
        (f"{filtered_main['回复数'].mean():.1f}", "平均回复", "avg_reply"),
    ]
    for col, (val, label, key) in zip([c1, c2, c3, c4, c5], metrics):
        with col:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-value">{val}</div>
                <div class="metric-label">{label}</div>
            </div>
            """, unsafe_allow_html=True)

st.markdown("<div style='height: 8px;'></div>", unsafe_allow_html=True)

# ============================================================
# 标签页
# ============================================================
tab1, tab2, tab3, tab4, tab5 = st.tabs(["概览", "发帖分析", "回复分析", "内容搜索", "VOC分析"])

# ============ Tab 1: 概览 ============
with tab1:
    col_left, col_right = st.columns([3, 2])

    with col_left:
        st.markdown('<div class="section-title">帖子主题分布</div>', unsafe_allow_html=True)
        if len(filtered_main) > 0:
            theme_counts = filtered_main['帖子主题'].value_counts().reset_index()
            theme_counts.columns = ['主题', '数量']
            fig = px.pie(
                theme_counts, values='数量', names='主题',
                color_discrete_sequence=PIE_COLORS,
                hole=0.45,
            )
            fig.update_traces(
                textposition='inside', textinfo='percent+label',
                textfont=dict(size=11), hovertemplate='%{label}<br>%{value} 条<br>占比 %{percent}<extra></extra>'
            )
            style_chart(fig, "", height=320)
            st.plotly_chart(fig, use_container_width=True)

        st.markdown('<div class="section-title" style="margin-top: 24px;">月度发帖趋势</div>', unsafe_allow_html=True)
        if len(filtered_main) > 0:
            filtered_main['月份'] = filtered_main['创建时间_dt'].dt.to_period('M').astype(str)
            monthly = filtered_main.groupby('月份').agg(
                发帖数=('回复数', 'size'),
                总回复=('回复数', 'sum'),
                总点赞=('点赞数', 'sum'),
            ).reset_index()
            fig = make_subplots(specs=[[{"secondary_y": True}]])
            fig.add_trace(
                go.Bar(x=monthly['月份'], y=monthly['发帖数'], name='发帖数',
                       marker_color=THEME['primary_lighter'], marker_line_color=THEME['primary'], marker_line_width=1),
                secondary_y=False
            )
            fig.add_trace(
                go.Scatter(x=monthly['月份'], y=monthly['总回复'], name='总回复',
                           mode='lines+markers', line=dict(color=THEME['primary'], width=2),
                           marker=dict(size=6, color=THEME['surface'], line=dict(color=THEME['primary'], width=2))),
                secondary_y=True
            )
            style_chart(fig, "", height=260)
            fig.update_yaxes(title_text="发帖数", secondary_y=False)
            fig.update_yaxes(title_text="总回复", secondary_y=True)
            st.plotly_chart(fig, use_container_width=True)

    with col_right:
        st.markdown('<div class="section-title">情绪分布</div>', unsafe_allow_html=True)
        if len(filtered_main) > 0:
            emotion_counts = filtered_main['情绪标签'].value_counts().reset_index()
            emotion_counts.columns = ['情绪', '数量']
            fig = px.bar(
                emotion_counts, x='情绪', y='数量', color='情绪',
                color_discrete_map=EMOTION_COLORS,
                text='数量',
            )
            fig.update_traces(textposition='outside', textfont=dict(size=12))
            style_chart(fig, "", height=220)
            st.plotly_chart(fig, use_container_width=True)

        st.markdown('<div class="section-title" style="margin-top: 24px;">产品提及热度</div>', unsafe_allow_html=True)
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
            fig = px.bar(
                product_counts, x='产品', y='提及次数', color='提及次数',
                color_continuous_scale='Blues',
                text='提及次数',
            )
            fig.update_traces(textposition='outside', textfont=dict(size=11))
            style_chart(fig, "", height=260)
            st.plotly_chart(fig, use_container_width=True)

        st.markdown('<div class="section-title" style="margin-top: 24px;">回复意图分布</div>', unsafe_allow_html=True)
        if len(filtered_reply) > 0:
            intent_counts = filtered_reply['意图标签'].value_counts().reset_index()
            intent_counts.columns = ['意图', '数量']
            fig = px.bar(
                intent_counts, x='意图', y='数量', color='数量',
                color_continuous_scale='Blues',
                text='数量',
            )
            fig.update_traces(textposition='outside', textfont=dict(size=11))
            style_chart(fig, "", height=220)
            st.plotly_chart(fig, use_container_width=True)

# ============ Tab 2: 发帖分析 ============
with tab2:
    col_left, col_right = st.columns(2)

    with col_left:
        st.markdown('<div class="section-title">发帖时段分布</div>', unsafe_allow_html=True)
        if len(filtered_main) > 0:
            hour_counts = filtered_main['发布小时'].value_counts().sort_index().reset_index()
            hour_counts.columns = ['小时', '发帖数']
            fig = px.bar(
                hour_counts, x='小时', y='发帖数',
                color='发帖数', color_continuous_scale='Blues',
            )
            style_chart(fig, "", height=260)
            st.plotly_chart(fig, use_container_width=True)

        st.markdown('<div class="section-title" style="margin-top: 20px;">内容长度 vs 回复数</div>', unsafe_allow_html=True)
        if len(filtered_main) > 0:
            filtered_main['内容长度'] = filtered_main['内容'].fillna('').astype(str).str.len()
            fig = px.scatter(
                filtered_main, x='内容长度', y='回复数', color='帖子主题',
                hover_data=['标题'], opacity=0.6, size_max=10,
                color_discrete_sequence=BLUE_PALETTE,
            )
            style_chart(fig, "", height=260)
            st.plotly_chart(fig, use_container_width=True)

    with col_right:
        st.markdown('<div class="section-title">各主题平均互动率</div>', unsafe_allow_html=True)
        if len(filtered_main) > 0 and '互动率' in filtered_main.columns:
            theme_interaction = filtered_main.groupby('帖子主题')['互动率'].mean().sort_values(ascending=True).reset_index()
            fig = px.bar(
                theme_interaction, x='互动率', y='帖子主题', orientation='h',
                color='互动率', color_continuous_scale='Blues',
                text=theme_interaction['互动率'].apply(lambda x: f'{x:.3f}'),
            )
            fig.update_traces(textposition='outside', textfont=dict(size=11))
            style_chart(fig, "", height=260)
            st.plotly_chart(fig, use_container_width=True)

    st.markdown('<div class="section-title" style="margin-top: 20px;">高质量帖子排行</div>', unsafe_allow_html=True)
    non_activity = filtered_main[filtered_main['是否活动贴'] == '否'].copy()
    col_sort, col_num = st.columns([1, 3])
    with col_sort:
        sort_by = st.selectbox("排序方式", ['互动率', '综合互动得分', '回复数', '点赞数', '浏览数'], label_visibility='collapsed')
    with col_num:
        top_n = st.slider("显示数量", 5, 50, 20, label_visibility='collapsed')

    if len(non_activity) > 0:
        display_cols = ['数据来源', '标题', '帖子主题', '回复数', '点赞数', '浏览数', '互动率', '综合互动得分', '提及产品', '情绪标签']
        display_cols = [c for c in display_cols if c in non_activity.columns]
        top_posts = non_activity.nlargest(top_n, sort_by)[display_cols]
        st.dataframe(top_posts, use_container_width=True, hide_index=True)

# ============ Tab 3: 回复分析 ============
with tab3:
    col_left, col_right = st.columns(2)

    with col_left:
        st.markdown('<div class="section-title">产品属性关注度</div>', unsafe_allow_html=True)
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
            fig = px.bar(
                attr_counts, x='属性', y='提及次数', color='提及次数',
                color_continuous_scale='Blues', text='提及次数',
            )
            fig.update_traces(textposition='outside', textfont=dict(size=11))
            style_chart(fig, "", height=260)
            st.plotly_chart(fig, use_container_width=True)

        st.markdown('<div class="section-title" style="margin-top: 20px;">各产品回复情绪分布</div>', unsafe_allow_html=True)
        product_emotion_data = []
        for _, row in filtered_reply.iterrows():
            products = str(row['提及产品']).split('、') if pd.notna(row['提及产品']) and row['提及产品'] else []
            for p in products:
                if p in all_products:
                    product_emotion_data.append({'产品': p, '情绪': row['情绪标签']})
        if product_emotion_data:
            pe_df = pd.DataFrame(product_emotion_data)
            pe_counts = pe_df.groupby(['产品', '情绪']).size().reset_index(name='数量')
            fig = px.bar(
                pe_counts, x='产品', y='数量', color='情绪', barmode='group',
                color_discrete_map=EMOTION_COLORS,
            )
            style_chart(fig, "", height=260)
            st.plotly_chart(fig, use_container_width=True)

    with col_right:
        st.markdown('<div class="section-title">楼层 vs 楼中楼 情绪对比</div>', unsafe_allow_html=True)
        reply_emotion = filtered_reply['情绪标签'].value_counts().reset_index()
        reply_emotion.columns = ['情绪', '数量']
        reply_emotion['类型'] = '楼层回复'
        lzl_emotion = filtered_lzl['情绪标签'].value_counts().reset_index()
        lzl_emotion.columns = ['情绪', '数量']
        lzl_emotion['类型'] = '楼中楼'
        combined = pd.concat([reply_emotion, lzl_emotion])
        fig = px.bar(combined, x='情绪', y='数量', color='类型', barmode='group',
                     color_discrete_sequence=[THEME['primary'], THEME['primary_lighter']])
        style_chart(fig, "", height=260)
        st.plotly_chart(fig, use_container_width=True)

        st.markdown('<div class="section-title" style="margin-top: 20px;">属性 × 情绪 热力图</div>', unsafe_allow_html=True)
        attr_emotion_data = []
        for _, row in filtered_reply.iterrows():
            attrs = str(row['产品属性标签']).split('、') if pd.notna(row['产品属性标签']) and row['产品属性标签'] else []
            for a in attrs:
                attr_emotion_data.append({'属性': a, '情绪': row['情绪标签']})
        if attr_emotion_data:
            ae_df = pd.DataFrame(attr_emotion_data)
            ae_pivot = ae_df.groupby(['属性', '情绪']).size().unstack(fill_value=0)
            fig = px.imshow(
                ae_pivot, text_auto=True, aspect="auto",
                color_continuous_scale='Blues',
            )
            style_chart(fig, "", height=260)
            st.plotly_chart(fig, use_container_width=True)

    st.markdown('<div class="section-title" style="margin-top: 20px;">高赞回复排行</div>', unsafe_allow_html=True)
    col_sort_r, col_num_r = st.columns([1, 3])
    with col_sort_r:
        sort_reply_by = st.selectbox("回复排序", ['点赞数', '楼中楼数'], key='reply_sort', label_visibility='collapsed')
    with col_num_r:
        top_reply_n = st.slider("显示数量", 5, 50, 20, key='reply_n', label_visibility='collapsed')

    if len(filtered_reply) > 0:
        reply_display_cols = ['数据来源', '内容', '点赞数', '楼中楼数', '情绪标签', '意图标签', '提及产品', '产品属性标签']
        reply_display_cols = [c for c in reply_display_cols if c in filtered_reply.columns]
        top_replies = filtered_reply.nlargest(top_reply_n, sort_reply_by)[reply_display_cols]
        st.dataframe(top_replies, use_container_width=True, hide_index=True)

# ============ Tab 4: 内容搜索 ============
with tab4:
    st.markdown('<div class="section-title">帖子内容搜索</div>', unsafe_allow_html=True)
    search_text = st.text_input("", placeholder="搜索关键词（标题/内容）...", label_visibility='collapsed')
    if search_text:
        mask = (
            filtered_main['标题'].fillna('').astype(str).str.contains(search_text, case=False, na=False) |
            filtered_main['内容'].fillna('').astype(str).str.contains(search_text, case=False, na=False)
        )
        search_results = filtered_main[mask]
    else:
        search_results = filtered_main
    st.caption(f"共 {len(search_results)} 条结果")
    display_cols = ['数据来源', '标题', '内容', '帖子主题', '是否活动贴', '回复数', '点赞数', '浏览数', '情绪标签', '提及产品', '产品属性标签', '创建时间']
    display_cols = [c for c in display_cols if c in search_results.columns]
    st.dataframe(search_results[display_cols].head(100), use_container_width=True, hide_index=True)

    st.markdown('<div class="section-title" style="margin-top: 24px;">回复内容搜索</div>', unsafe_allow_html=True)
    search_reply_text = st.text_input("", placeholder="搜索回复关键词...", key='reply_search', label_visibility='collapsed')
    if search_reply_text:
        mask_r = filtered_reply['内容'].fillna('').astype(str).str.contains(search_reply_text, case=False, na=False)
        search_reply_results = filtered_reply[mask_r]
    else:
        search_reply_results = filtered_reply
    st.caption(f"共 {len(search_reply_results)} 条结果")
    reply_cols = ['数据来源', '内容', '点赞数', '楼中楼数', '情绪标签', '意图标签', '提及产品', '产品属性标签']
    reply_cols = [c for c in reply_cols if c in search_reply_results.columns]
    st.dataframe(search_reply_results[reply_cols].head(100), use_container_width=True, hide_index=True)

# ============ Tab 5: VOC分析 ============
with tab5:
    st.markdown('<div class="section-title">重点产品用户原声 (VOC) 分析</div>', unsafe_allow_html=True)

    if len(voc_summary) > 0:
        # 产品选择
        product_list = voc_summary['产品'].tolist()
        col_sel, col_blank = st.columns([1, 4])
        with col_sel:
            selected_product = st.selectbox("选择产品", product_list, label_visibility='collapsed')
        st.caption(f"当前查看：{selected_product}")

        product_data = voc_summary[voc_summary['产品'] == selected_product].iloc[0]
        pos_voices = voc_voices[(voc_voices['产品'] == selected_product) & (voc_voices['情绪'] == '正面')]['内容'].tolist()
        neg_voices = voc_voices[(voc_voices['产品'] == selected_product) & (voc_voices['情绪'] == '负面')]['内容'].tolist()
        pos_words = voc_words[(voc_words['产品'] == selected_product) & (voc_words['情绪'] == '正面')]
        neg_words = voc_words[(voc_words['产品'] == selected_product) & (voc_words['情绪'] == '负面')]

        # 指标卡片
        c1, c2, c3, c4, c5 = st.columns(5)
        metrics_voc = [
            (int(product_data['总提及数']), "总提及", "total"),
            (int(product_data['正面数']), "正面", "positive"),
            (int(product_data['负面数']), "负面", "negative"),
            (int(product_data['中性数']), "中性", "neutral"),
            (int(product_data['正面数']) - int(product_data['负面数']), "净推荐值", "nps"),
        ]
        for col, (val, label, key) in zip([c1, c2, c3, c4, c5], metrics_voc):
            with col:
                st.markdown(f"""
                <div class="metric-card">
                    <div class="metric-value">{val}</div>
                    <div class="metric-label">{label}</div>
                </div>
                """, unsafe_allow_html=True)

        st.markdown("<div style='height: 16px;'></div>", unsafe_allow_html=True)

        col_left, col_right = st.columns(2)

        with col_left:
            st.markdown('<div class="section-title">好评分析</div>', unsafe_allow_html=True)

            pos_attrs = []
            for col in ['好评属性TOP1', '好评属性TOP2', '好评属性TOP3']:
                if pd.notna(product_data[col]) and product_data[col]:
                    pos_attrs.append(product_data[col])
            if pos_attrs:
                attr_df = pd.DataFrame({'属性': pos_attrs, '排名': [f'TOP{i+1}' for i in range(len(pos_attrs))]})
                fig = px.bar(attr_df, x='属性', y='排名', color='属性',
                           color_discrete_sequence=BLUE_PALETTE[:len(pos_attrs)],
                           text='排名')
                fig.update_traces(textposition='outside')
                style_chart(fig, "好评属性 TOP3", height=200)
                st.plotly_chart(fig, use_container_width=True)

            if len(pos_words) > 0:
                fig = px.bar(pos_words.head(10), x='关键词', y='频次', color='频次',
                           color_continuous_scale='Blues', text='频次')
                fig.update_traces(textposition='outside')
                style_chart(fig, "好评高频关键词", height=200)
                st.plotly_chart(fig, use_container_width=True)

            st.markdown("<div style='font-size: 0.85rem; font-weight: 600; color: #2C3E50; margin: 12px 0 8px 0;'>好评原声</div>", unsafe_allow_html=True)
            for i, voice in enumerate(pos_voices[:5]):
                if voice and str(voice).strip():
                    st.markdown(f"""
                    <div class="info-card positive">
                        <div style="font-size: 0.8rem; color: #4CAF50; font-weight: 600; margin-bottom: 4px;">#{i+1}</div>
                        <div style="font-size: 0.85rem; color: #2C3E50; line-height: 1.5;">{voice}</div>
                    </div>
                    """, unsafe_allow_html=True)

        with col_right:
            st.markdown('<div class="section-title">差评分析</div>', unsafe_allow_html=True)

            neg_attrs = []
            for col in ['差评属性TOP1', '差评属性TOP2', '差评属性TOP3']:
                if pd.notna(product_data[col]) and product_data[col]:
                    neg_attrs.append(product_data[col])
            if neg_attrs:
                attr_df = pd.DataFrame({'属性': neg_attrs, '排名': [f'TOP{i+1}' for i in range(len(neg_attrs))]})
                fig = px.bar(attr_df, x='属性', y='排名', color='属性',
                           color_discrete_sequence=['#EF5350', '#FF7043', '#FF8A65'][:len(neg_attrs)],
                           text='排名')
                fig.update_traces(textposition='outside')
                style_chart(fig, "差评属性 TOP3", height=200)
                st.plotly_chart(fig, use_container_width=True)

            if len(neg_words) > 0:
                fig = px.bar(neg_words.head(10), x='关键词', y='频次', color='频次',
                           color_continuous_scale='Reds', text='频次')
                fig.update_traces(textposition='outside')
                style_chart(fig, "差评高频关键词", height=200)
                st.plotly_chart(fig, use_container_width=True)

            st.markdown("<div style='font-size: 0.85rem; font-weight: 600; color: #2C3E50; margin: 12px 0 8px 0;'>差评原声</div>", unsafe_allow_html=True)
            for i, voice in enumerate(neg_voices[:5]):
                if voice and str(voice).strip():
                    st.markdown(f"""
                    <div class="info-card negative">
                        <div style="font-size: 0.8rem; color: #EF5350; font-weight: 600; margin-bottom: 4px;">#{i+1}</div>
                        <div style="font-size: 0.85rem; color: #2C3E50; line-height: 1.5;">{voice}</div>
                    </div>
                    """, unsafe_allow_html=True)

        st.markdown("<div style='height: 16px;'></div>", unsafe_allow_html=True)
        st.markdown('<div class="section-title">产品对比概览</div>', unsafe_allow_html=True)

        col_a, col_b = st.columns(2)
        with col_a:
            fig = px.bar(voc_summary, x='产品', y=['正面数', '负面数', '中性数'],
                        title='各产品情绪分布对比', barmode='group',
                        color_discrete_map={'正面数': '#4CAF50', '负面数': '#EF5350', '中性数': '#90A4AE'})
            style_chart(fig, "", height=280)
            st.plotly_chart(fig, use_container_width=True)

        with col_b:
            voc_summary['正面占比数值'] = voc_summary['正面占比'].str.replace('%', '').astype(float)
            fig = px.bar(voc_summary.sort_values('正面占比数值', ascending=True),
                        x='正面占比数值', y='产品', orientation='h',
                        color='正面占比数值', color_continuous_scale='Blues',
                        text=voc_summary['正面占比'].str.replace('%', ''))
            fig.update_traces(textposition='outside', texttemplate='%{text}%')
            style_chart(fig, "各产品好评率排名", height=280)
            st.plotly_chart(fig, use_container_width=True)
