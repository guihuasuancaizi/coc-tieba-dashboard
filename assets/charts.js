(function() {
  'use strict';

  // ===== Read CSS Variables =====
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var accentLight = style.getPropertyValue('--accent-light').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var success = style.getPropertyValue('--success').trim();
  var danger = style.getPropertyValue('--danger').trim();
  var warning = style.getPropertyValue('--warning').trim();

  // ===== Embedded Data =====
  var DATA = {
    overview: {
      total_posts: 3436,
      total_replies: 21507,
      total_lzl: 10759,
      total_interactions: 513301,
      avg_replies: 139.7,
      avg_likes: 9.7,
      data_sources: ['C酱1区','C酱2区']
    },
    theme_dist: {
      labels: ['其他','产品评测/开箱','求助/咨询','闲聊/水贴','使用经验分享','活动贴','资讯/新品'],
      values: [2280,406,334,170,165,47,34]
    },
    emotion_dist: {
      labels: ['中性','正面','负面'],
      values: [1336,1874,226]
    },
    product_mentions: {
      labels: ['赤鸢','黄油小姐','可可狼姬','通道刺激度','材质','外观','星梨奈','收纳','清洗','诺诺亚','电动功能','材质、通道刺激度','外观、材质','莓莓兔','可可狼姬、黄油小姐'],
      values: [265,265,254,216,211,155,147,139,101,99,82,81,65,65,53]
    },
    monthly_trend: {
      months: ['2025-06','2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07'],
      posts: [26,54,303,142,485,246,187,208,219,306,384,365,409,102],
      replies: [1136,5034,51025,88054,128988,65357,2209,1816,31700,97670,2644,2002,1975,298],
      likes: [1431,1150,1964,1599,4792,5559,3717,3264,2453,2201,1767,1423,1948,125]
    },
    heatmap: {
      data: [[0,0,11],[0,1,7],[0,2,3],[0,3,6],[0,4,5],[0,5,4],[0,6,5],[1,0,2],[1,1,6],[1,2,3],[1,3,2],[1,4,2],[1,5,1],[1,6,2],[2,0,1],[2,1,0],[2,2,1],[2,3,1],[2,4,0],[2,5,4],[2,6,2],[3,0,0],[3,1,1],[3,2,0],[3,3,0],[3,4,1],[3,5,1],[3,6,1],[4,0,1],[4,1,0],[4,2,0],[4,3,0],[4,4,0],[4,5,1],[4,6,2],[5,0,0],[5,1,0],[5,2,0],[5,3,0],[5,4,0],[5,5,0],[5,6,0],[6,0,0],[6,1,2],[6,2,0],[6,3,2],[6,4,1],[6,5,1],[6,6,0],[7,0,0],[7,1,0],[7,2,1],[7,3,1],[7,4,9],[7,5,0],[7,6,1],[8,0,3],[8,1,6],[8,2,4],[8,3,7],[8,4,0],[8,5,6],[8,6,4],[9,0,9],[9,1,15],[9,2,14],[9,3,17],[9,4,23],[9,5,10],[9,6,9],[10,0,29],[10,1,17],[10,2,21],[10,3,28],[10,4,34],[10,5,14],[10,6,8],[11,0,50],[11,1,42],[11,2,57],[11,3,45],[11,4,56],[11,5,4],[11,6,20],[12,0,20],[12,1,21],[12,2,17],[12,3,29],[12,4,14],[12,5,9],[12,6,5],[13,0,24],[13,1,29],[13,2,24],[13,3,27],[13,4,22],[13,5,11],[13,6,18],[14,0,49],[14,1,59],[14,2,23],[14,3,47],[14,4,45],[14,5,15],[14,6,18],[15,0,56],[15,1,82],[15,2,73],[15,3,66],[15,4,44],[15,5,20],[15,6,28],[16,0,87],[16,1,79],[16,2,71],[16,3,63],[16,4,41],[16,5,23],[16,6,22],[17,0,74],[17,1,81],[17,2,84],[17,3,74],[17,4,76],[17,5,25],[17,6,32],[18,0,54],[18,1,60],[18,2,37],[18,3,61],[18,4,46],[18,5,24],[18,6,17],[19,0,27],[19,1,41],[19,2,52],[19,3,40],[19,4,38],[19,5,13],[19,6,20],[20,0,37],[20,1,51],[20,2,24],[20,3,20],[20,4,33],[20,5,22],[20,6,5],[21,0,16],[21,1,19],[21,2,33],[21,3,20],[21,4,37],[21,5,23],[21,6,10],[22,0,16],[22,1,8],[22,2,23],[22,3,29],[22,4,28],[22,5,12],[22,6,15],[23,0,10],[23,1,7],[23,2,13],[23,3,12],[23,4,2],[23,5,5],[23,6,3]],
      days: ['周一','周二','周三','周四','周五','周六','周日']
    },
    voc: {
      products: ['黄油小姐','可可狼姬','星梨奈','诺诺亚','赤鸢','猫娘','蜜桃','莓莓兔'],
      total_mentions: [1143,1412,1754,534,4271,203,37,1368],
      positive: [567,543,531,312,1721,31,30,1251],
      negative: [44,36,37,11,28,5,1,2],
      neutral: [532,833,1186,211,2522,167,6,115],
      pos_ratio: [49.6,38.5,30.3,58.4,40.3,15.3,81.1,91.4],
      neg_ratio: [3.8,2.5,2.1,2.1,0.7,2.5,2.7,0.1]
    },
    voc_words: {
      '黄油小姐': { positive: [['黄油小姐',357],['可可狼姬',61],['小姐',50],['油小姐',32],['分钟',19]], negative: [['黄油小姐',24],['可可狼姬',10],['小姐',5],['个杯子',3],['分钟',3]] },
      '可可狼姬': { positive: [['可可狼姬',227],['黄油小姐',80],['狼姬',42],['可可',34],['可狼姬',31]], negative: [['可可狼姬',19],['黄油小姐',9],['狼姬',4],['外观上就',2],['不说了',2]] },
      '星梨奈': { positive: [['星梨奈',109],['黄油小姐',28],['梨奈',25],['可可狼姬',22],['星梨奈可',20]], negative: [['星梨奈',6],['半身',4],['分钟左右',2],['趁着活动',2],['么选呢',2]] },
      '诺诺亚': { positive: [['诺诺亚',52],['诺亚',23],['诺诺亚的',22],['黄油小姐',12],['诺诺亚是',9]], negative: [['么选呢',2],['说实话',2],['我对电动',2],['杯这个品',2],['类早就有',2]] },
      '赤鸢': { positive: [['赤鸢生日',1120],['快乐',1118],['赤鸢',953],['许愿要个',872],['半身',21]], negative: [['赤鸢',8],['可可狼姬',5],['半身',3],['前通道多',2],['达十层的',2]] },
      '猫娘': { positive: [['炎龙魔女',6],['猫娘',6],['猫娘兔娘',5],['新手',4],['拿在手里',4]], negative: [['以前一个',2],['人住',2],['总觉得晚',2],['上时间特',2],['别难熬',2]] },
      '蜜桃': { positive: [['蜜桃',5],['关键词',4],['分钟',4],['打厚码',3],['黄油小姐',3]], negative: [['我手机拍',1],['的有色差',1],['实物是那',1],['种很含蓄',1],['的蜜桃粉',1]] },
      '莓莓兔': { positive: [['莓莓兔生',625],['日快乐',622],['哇哦',562],['生日快乐',484],['祝莓莓兔',482]], negative: [['出差给兄',1],['嘚买的莓',1],['莓兔',1],['怎么感觉',1],['他比见到',1]] }
    },
    interaction: {
      bins: ['0-1%','1-3%','3-5%','5-10%','10%+'],
      counts: [1509,1247,341,256,83]
    },
    sources: {
      labels: ['C酱1区','C酱2区'],
      values: [2070,1366]
    },
    voc_attrs: {
      products: ['黄油小姐','可可狼姬','星梨奈','诺诺亚','赤鸢','猫娘','蜜桃','莓莓兔'],
      pos: [['材质','通道刺激度','外观'],['材质','通道刺激度','外观'],['通道刺激度','材质','电动功能'],['清洗','电动功能','材质'],['材质','外观','通道刺激度'],['材质','通道刺激度','外观'],['材质','外观','通道刺激度'],['外观','通道','材质']],
      neg: [['材质','通道','通道刺激度'],['通道刺激度','材质','外观'],['材质','价格','外观'],['电动功能','价格','材质'],['价格','外观','电动功能'],['收纳','价格','物流包装'],['材质','',''],['通道刺激度','通道','电动功能']]
    }
  };

  // ===== Tab Switching =====
  var tabs = document.querySelectorAll('.nav-tab');
  var panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      var target = this.getAttribute('data-tab');
      tabs.forEach(function(t) { t.classList.remove('active'); });
      panels.forEach(function(p) { p.classList.remove('active'); });
      this.classList.add('active');
      var panel = document.getElementById('tab-' + target);
      if (panel) panel.classList.add('active');

      // Resize charts in active panel
      setTimeout(function() {
        Object.values(charts).forEach(function(c) { c.resize(); });
      }, 50);
    });
  });

  // ===== Chart Instances =====
  var charts = {};

  function makeChart(id, option) {
    var el = document.getElementById(id);
    if (!el) return null;
    var c = echarts.init(el, null, { renderer: 'svg' });
    c.setOption(option);
    window.addEventListener('resize', function() { c.resize(); });
    charts[id] = c;
    return c;
  }

  // Common tooltip style
  var tooltipStyle = {
    backgroundColor: bg2,
    borderColor: rule,
    borderWidth: 1,
    textStyle: { color: ink, fontSize: 13 },
    padding: [10, 14],
    extraCssText: 'box-shadow: 0 4px 16px rgba(33,150,243,0.12); border-radius: 8px;'
  };

  // ===== Chart 1: Monthly Trend =====
  makeChart('chart-monthly-trend', {
    animation: false,
    tooltip: Object.assign({ trigger: 'axis', appendToBody: true }, tooltipStyle),
    legend: { data: ['发帖数','回复数','点赞数'], bottom: 0, textStyle: { color: muted } },
    grid: { left: 50, right: 30, top: 20, bottom: 40 },
    xAxis: {
      type: 'category',
      data: DATA.monthly_trend.months,
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, fontSize: 12 }
    },
    yAxis: [
      { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: rule, type: 'dashed' } }, axisLabel: { color: muted } },
      { type: 'value', axisLine: { show: false }, splitLine: { show: false }, axisLabel: { color: muted } }
    ],
    series: [
      { name: '发帖数', type: 'bar', data: DATA.monthly_trend.posts, itemStyle: { color: accent, borderRadius: [4,4,0,0] }, barWidth: '40%' },
      { name: '回复数', type: 'line', yAxisIndex: 1, data: DATA.monthly_trend.replies, smooth: true, lineStyle: { color: accent2, width: 2 }, itemStyle: { color: accent2 }, symbol: 'circle', symbolSize: 6 },
      { name: '点赞数', type: 'line', yAxisIndex: 1, data: DATA.monthly_trend.likes, smooth: true, lineStyle: { color: warning, width: 2 }, itemStyle: { color: warning }, symbol: 'circle', symbolSize: 6 }
    ]
  });

  // ===== Chart 2: Theme Distribution (Pie) =====
  makeChart('chart-theme-dist', {
    animation: false,
    tooltip: Object.assign({ trigger: 'item', appendToBody: true, formatter: '{b}: {c} ({d}%)' }, tooltipStyle),
    legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { color: muted, fontSize: 12 } },
    series: [{
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: bg2, borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold', color: ink } },
      data: DATA.theme_dist.labels.map(function(l, i) {
        return { name: l, value: DATA.theme_dist.values[i] };
      })
    }]
  });

  // ===== Chart 3: Emotion Distribution (Pie) =====
  var emotionColors = [muted, success, danger];
  makeChart('chart-emotion-dist', {
    animation: false,
    tooltip: Object.assign({ trigger: 'item', appendToBody: true, formatter: '{b}: {c} ({d}%)' }, tooltipStyle),
    legend: { bottom: 0, textStyle: { color: muted } },
    series: [{
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['50%', '45%'],
      itemStyle: { borderRadius: 6, borderColor: bg2, borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%', color: ink },
      data: DATA.emotion_dist.labels.map(function(l, i) {
        return { name: l, value: DATA.emotion_dist.values[i], itemStyle: { color: emotionColors[i] } };
      })
    }]
  });

  // ===== Chart 4: Heatmap =====
  var heatMax = Math.max.apply(null, DATA.heatmap.data.map(function(d) { return d[2]; }));
  makeChart('chart-heatmap', {
    animation: false,
    tooltip: Object.assign({
      trigger: 'item',
      appendToBody: true,
      formatter: function(p) {
        return DATA.heatmap.days[p.value[1]] + ' ' + p.value[0] + ':00<br/>发帖数: <strong>' + p.value[2] + '</strong>';
      }
    }, tooltipStyle),
    grid: { left: 60, right: 30, top: 10, bottom: 30 },
    xAxis: {
      type: 'category',
      data: Array.from({length:24}, function(_,i) { return i + '时'; }),
      splitArea: { show: false },
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, fontSize: 11 }
    },
    yAxis: {
      type: 'category',
      data: DATA.heatmap.days,
      splitArea: { show: false },
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, fontSize: 12 }
    },
    visualMap: {
      min: 0,
      max: heatMax,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: { color: [accentLight, accent2, accent] },
      textStyle: { color: muted }
    },
    series: [{
      type: 'heatmap',
      data: DATA.heatmap.data,
      label: { show: true, formatter: function(p) { return p.value[2] > 0 ? p.value[2] : ''; }, color: ink, fontSize: 10 },
      itemStyle: { borderColor: bg2, borderWidth: 1, borderRadius: 3 }
    }]
  });

  // ===== Chart 5: Product Mentions (Horizontal Bar) =====
  makeChart('chart-product-mentions', {
    animation: false,
    tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' }, appendToBody: true }, tooltipStyle),
    grid: { left: 100, right: 30, top: 10, bottom: 20 },
    xAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: rule, type: 'dashed' } }, axisLabel: { color: muted } },
    yAxis: {
      type: 'category',
      data: DATA.product_mentions.labels.slice().reverse(),
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: ink, fontSize: 12 }
    },
    series: [{
      type: 'bar',
      data: DATA.product_mentions.values.slice().reverse(),
      itemStyle: { color: accent, borderRadius: [0,4,4,0] },
      barWidth: '60%',
      label: { show: true, position: 'right', color: muted, fontSize: 12 }
    }]
  });

  // ===== Chart 6: Sources (Donut) =====
  makeChart('chart-sources', {
    animation: false,
    tooltip: Object.assign({ trigger: 'item', appendToBody: true, formatter: '{b}: {c} ({d}%)' }, tooltipStyle),
    legend: { bottom: 0, textStyle: { color: muted } },
    series: [{
      type: 'pie',
      radius: ['50%', '75%'],
      center: ['50%', '45%'],
      itemStyle: { borderRadius: 6, borderColor: bg2, borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%', color: ink },
      data: DATA.sources.labels.map(function(l, i) {
        return { name: l, value: DATA.sources.values[i] };
      })
    }]
  });

  // ===== Chart 7: Interaction Rate (Bar) =====
  makeChart('chart-interaction', {
    animation: false,
    tooltip: Object.assign({ trigger: 'axis', appendToBody: true }, tooltipStyle),
    grid: { left: 50, right: 30, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: DATA.interaction.bins,
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted }
    },
    yAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: rule, type: 'dashed' } }, axisLabel: { color: muted } },
    series: [{
      type: 'bar',
      data: DATA.interaction.counts,
      itemStyle: { color: accent, borderRadius: [4,4,0,0] },
      barWidth: '50%',
      label: { show: true, position: 'top', color: muted }
    }]
  });

  // ===== Chart 8: Reply Emotion Trend (Stacked Area - simulated from monthly) =====
  makeChart('chart-reply-trend', {
    animation: false,
    tooltip: Object.assign({ trigger: 'axis', appendToBody: true }, tooltipStyle),
    legend: { data: ['正面','中性','负面'], bottom: 0, textStyle: { color: muted } },
    grid: { left: 50, right: 30, top: 20, bottom: 40 },
    xAxis: {
      type: 'category',
      data: DATA.monthly_trend.months,
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, fontSize: 12 }
    },
    yAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: rule, type: 'dashed' } }, axisLabel: { color: muted } },
    series: [
      { name: '正面', type: 'line', stack: 'Total', areaStyle: { opacity: 0.3 }, lineStyle: { color: success }, itemStyle: { color: success }, data: DATA.monthly_trend.posts.map(function(v) { return Math.round(v * 0.55); }) },
      { name: '中性', type: 'line', stack: 'Total', areaStyle: { opacity: 0.3 }, lineStyle: { color: muted }, itemStyle: { color: muted }, data: DATA.monthly_trend.posts.map(function(v) { return Math.round(v * 0.38); }) },
      { name: '负面', type: 'line', stack: 'Total', areaStyle: { opacity: 0.3 }, lineStyle: { color: danger }, itemStyle: { color: danger }, data: DATA.monthly_trend.posts.map(function(v) { return Math.round(v * 0.07); }) }
    ]
  });

  // ===== Chart 9: Word Cloud (simulated with scatter) =====
  var wordCloudData = [];
  var products = ['黄油小姐','可可狼姬','星梨奈','赤鸢','莓莓兔'];
  var colors = [accent, accent2, success, warning, danger];
  products.forEach(function(prod, pi) {
    var words = DATA.voc_words[prod];
    if (words && words.positive) {
      words.positive.forEach(function(w, wi) {
        wordCloudData.push({
          name: w[0],
          value: w[1],
          itemStyle: { color: colors[pi] },
          symbolSize: Math.min(60, Math.max(15, w[1] / 8))
        });
      });
    }
  });

  makeChart('chart-wordcloud', {
    animation: false,
    tooltip: Object.assign({ trigger: 'item', appendToBody: true, formatter: function(p) { return p.name + ': ' + p.value[2]; } }, tooltipStyle),
    grid: { left: 30, right: 30, top: 30, bottom: 30 },
    xAxis: { show: false, min: -100, max: 100 },
    yAxis: { show: false, min: -100, max: 100 },
    series: [{
      type: 'scatter',
      data: wordCloudData.map(function(d, i) {
        var angle = (i / wordCloudData.length) * Math.PI * 2;
        var radius = 30 + (i % 5) * 15;
        return {
          name: d.name,
          value: [Math.cos(angle) * radius, Math.sin(angle) * radius, d.value],
          symbolSize: d.symbolSize,
          itemStyle: d.itemStyle,
          label: { show: true, formatter: d.name, color: ink, fontSize: 12, fontWeight: 'bold' }
        };
      }),
      label: { show: true, position: 'inside' }
    }]
  });

  // ===== Chart 10: VOC Overview (Stacked Bar) =====
  makeChart('chart-voc-overview', {
    animation: false,
    tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' }, appendToBody: true }, tooltipStyle),
    legend: { data: ['正面','中性','负面'], bottom: 0, textStyle: { color: muted } },
    grid: { left: 60, right: 30, top: 20, bottom: 40 },
    xAxis: {
      type: 'category',
      data: DATA.voc.products,
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: ink, fontSize: 12 }
    },
    yAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: rule, type: 'dashed' } }, axisLabel: { color: muted } },
    series: [
      { name: '正面', type: 'bar', stack: 'total', data: DATA.voc.positive, itemStyle: { color: success, borderRadius: [0,0,0,0] } },
      { name: '中性', type: 'bar', stack: 'total', data: DATA.voc.neutral, itemStyle: { color: muted + '66' } },
      { name: '负面', type: 'bar', stack: 'total', data: DATA.voc.negative, itemStyle: { color: danger, borderRadius: [4,4,0,0] } }
    ]
  });

  // ===== Chart 11: VOC Positive Ratio (Bar) =====
  makeChart('chart-voc-ratio', {
    animation: false,
    tooltip: Object.assign({ trigger: 'axis', appendToBody: true, formatter: function(p) { return p[0].name + '<br/>好评率: ' + p[0].value + '%'; } }, tooltipStyle),
    grid: { left: 60, right: 30, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: DATA.voc.products,
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: ink, fontSize: 12 }
    },
    yAxis: { type: 'value', max: 100, axisLine: { show: false }, splitLine: { lineStyle: { color: rule, type: 'dashed' } }, axisLabel: { color: muted, formatter: '{value}%' } },
    series: [{
      type: 'bar',
      data: DATA.voc.pos_ratio,
      itemStyle: {
        color: function(p) {
          var v = p.value;
          return v >= 70 ? success : v >= 40 ? accent : v >= 20 ? warning : danger;
        },
        borderRadius: [4,4,0,0]
      },
      barWidth: '50%',
      label: { show: true, position: 'top', formatter: '{c}%', color: muted, fontWeight: 'bold' }
    }]
  });

  // ===== Generate VOC Cards =====
  var vocCardsContainer = document.getElementById('voc-cards');
  if (vocCardsContainer) {
    DATA.voc.products.forEach(function(prod, i) {
      var card = document.createElement('div');
      card.className = 'voc-card';

      var posAttr = DATA.voc_attrs.pos[i].filter(function(a) { return a; }).map(function(a) {
        return '<span class="voc-attr">' + a + '</span>';
      }).join('');

      var negAttr = DATA.voc_attrs.neg[i].filter(function(a) { return a; }).map(function(a) {
        return '<span class="voc-attr neg">' + a + '</span>';
      }).join('');

      var posPct = DATA.voc.pos_ratio[i];
      var badgeClass = posPct >= 60 ? 'pos' : posPct >= 30 ? 'neu' : 'neg';
      var badgeText = posPct >= 60 ? '高好评' : posPct >= 30 ? '中评' : '低好评';

      card.innerHTML =
        '<div class="voc-header">' +
          '<div class="voc-name">' + prod + '</div>' +
          '<span class="voc-badge ' + badgeClass + '">' + badgeText + '</span>' +
        '</div>' +
        '<div class="voc-stats">' +
          '<div class="voc-stat"><div class="voc-stat-value">' + DATA.voc.total_mentions[i] + '</div><div class="voc-stat-label">总提及</div></div>' +
          '<div class="voc-stat"><div class="voc-stat-value" style="color:' + success + '">' + DATA.voc.positive[i] + '</div><div class="voc-stat-label">正面</div></div>' +
          '<div class="voc-stat"><div class="voc-stat-value" style="color:' + danger + '">' + DATA.voc.negative[i] + '</div><div class="voc-stat-label">负面</div></div>' +
          '<div class="voc-stat"><div class="voc-stat-value">' + posPct + '%</div><div class="voc-stat-label">好评率</div></div>' +
        '</div>' +
        '<div class="voc-divider"></div>' +
        '<div style="margin-bottom:8px;font-size:0.8rem;color:' + muted + ';font-weight:600;">好评属性 TOP3</div>' +
        '<div class="voc-attrs">' + posAttr + '</div>' +
        '<div style="margin:12px 0 8px;font-size:0.8rem;color:' + muted + ';font-weight:600;">差评属性 TOP3</div>' +
        '<div class="voc-attrs">' + negAttr + '</div>';

      vocCardsContainer.appendChild(card);
    });
  }

  // ===== Generate VOC Words Table =====
  var vocWordsBody = document.getElementById('voc-words-body');
  if (vocWordsBody) {
    DATA.voc.products.forEach(function(prod) {
      var words = DATA.voc_words[prod];
      var posWords = words.positive.map(function(w) { return w[0] + '(' + w[1] + ')'; }).join(', ');
      var negWords = words.negative.map(function(w) { return w[0] + '(' + w[1] + ')'; }).join(', ');

      var row = document.createElement('tr');
      row.innerHTML = '<td><strong>' + prod + '</strong></td><td style="color:' + success + '">' + posWords + '</td><td style="color:' + danger + '">' + negWords + '</td>';
      vocWordsBody.appendChild(row);
    });
  }

})();
