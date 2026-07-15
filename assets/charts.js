(function() {
  'use strict';

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

  var chartInstances = {};
  var allMonths = RAW_DATA.options.months.slice();

  // ===== VOC Static Data =====
  var VOC_DATA = {
    products: ['黄油小姐','可可狼姬','星梨奈','诺诺亚','赤鸢','猫娘','蜜桃','莓莓兔'],
    total_mentions: [1143,1412,1754,534,4271,203,37,1368],
    positive: [567,543,531,312,1721,31,30,1251],
    negative: [44,36,37,11,28,5,1,2],
    neutral: [532,833,1186,211,2522,167,6,115],
    pos_ratio: [49.6,38.5,30.3,58.4,40.3,15.3,81.1,91.4],
    neg_ratio: [3.8,2.5,2.1,2.1,0.7,2.5,2.7,0.1],
    attrs: {
      pos: [['材质','通道刺激度','外观'],['材质','通道刺激度','外观'],['通道刺激度','材质','电动功能'],['清洗','电动功能','材质'],['材质','外观','通道刺激度'],['材质','通道刺激度','外观'],['材质','外观','通道刺激度'],['外观','通道','材质']],
      neg: [['材质','通道','通道刺激度'],['通道刺激度','材质','外观'],['材质','价格','外观'],['电动功能','价格','材质'],['价格','外观','电动功能'],['收纳','价格','物流包装'],['材质','',''],['通道刺激度','通道','电动功能']]
    },
    words: {
      '黄油小姐': { pos: [['黄油小姐',357],['可可狼姬',61],['小姐',50],['油小姐',32],['分钟',19]], neg: [['黄油小姐',24],['可可狼姬',10],['小姐',5],['个杯子',3],['分钟',3]] },
      '可可狼姬': { pos: [['可可狼姬',227],['黄油小姐',80],['狼姬',42],['可可',34],['可狼姬',31]], neg: [['可可狼姬',19],['黄油小姐',9],['狼姬',4],['外观上就',2],['不说了',2]] },
      '星梨奈': { pos: [['星梨奈',109],['黄油小姐',28],['梨奈',25],['可可狼姬',22],['星梨奈可',20]], neg: [['星梨奈',6],['半身',4],['分钟左右',2],['趁着活动',2],['么选呢',2]] },
      '诺诺亚': { pos: [['诺诺亚',52],['诺亚',23],['诺诺亚的',22],['黄油小姐',12],['诺诺亚是',9]], neg: [['么选呢',2],['说实话',2],['我对电动',2],['杯这个品',2],['类早就有',2]] },
      '赤鸢': { pos: [['赤鸢生日',1120],['快乐',1118],['赤鸢',953],['许愿要个',872],['半身',21]], neg: [['赤鸢',8],['可可狼姬',5],['半身',3],['前通道多',2],['达十层的',2]] },
      '猫娘': { pos: [['炎龙魔女',6],['猫娘',6],['猫娘兔娘',5],['新手',4],['拿在手里',4]], neg: [['以前一个',2],['人住',2],['总觉得晚',2],['上时间特',2],['别难熬',2]] },
      '蜜桃': { pos: [['蜜桃',5],['关键词',4],['分钟',4],['打厚码',3],['黄油小姐',3]], neg: [['我手机拍',1],['的有色差',1],['实物是那',1],['种很含蓄',1],['的蜜桃粉',1]] },
      '莓莓兔': { pos: [['莓莓兔生',625],['日快乐',622],['哇哦',562],['生日快乐',484],['祝莓莓兔',482]], neg: [['出差给兄',1],['嘚买的莓',1],['莓兔',1],['怎么感觉',1],['他比见到',1]] }
    }
  };

  // ===== Utils =====
  function fmt(n) { return n.toLocaleString('zh-CN'); }
  function countBy(arr, key) {
    var c = {};
    arr.forEach(function(r) { var v = r[key]; c[v] = (c[v] || 0) + 1; });
    return c;
  }
  function topN(obj, n) {
    return Object.entries(obj).sort(function(a,b){ return b[1]-a[1]; }).slice(0, n);
  }

  // ===== Filter UI Init =====
  function createOptions(containerId, options, counts) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    options.forEach(function(opt) {
      var label = document.createElement('label');
      label.className = 'filter-option';
      var cnt = counts && counts[opt] ? counts[opt] : 0;
      label.innerHTML = '<input type="checkbox" value="' + opt + '" checked><span>' + opt + '</span><span class="opt-count">' + cnt + '</span>';
      container.appendChild(label);
    });
  }

  function initFilters() {
    var recs = RAW_DATA.records;
    var srcCounts = countBy(recs, 'source');
    var themeCounts = countBy(recs, 'theme');
    var emotionCounts = countBy(recs, 'emotion');
    var prodCounts = {};
    recs.forEach(function(r) { r.products.forEach(function(p) { prodCounts[p] = (prodCounts[p]||0)+1; }); });
    var actCounts = countBy(recs, 'is_activity');

    createOptions('filter-sources', RAW_DATA.options.sources, srcCounts);
    createOptions('filter-themes', RAW_DATA.options.themes, themeCounts);
    createOptions('filter-emotions', RAW_DATA.options.emotions, emotionCounts);

    // Products: sort by count desc
    var prodList = RAW_DATA.options.products.slice().sort(function(a,b){ return (prodCounts[b]||0)-(prodCounts[a]||0); });
    createOptions('filter-products', prodList, prodCounts);

    // Activity
    var actContainer = document.getElementById('filter-activity');
    if (actContainer) {
      actContainer.innerHTML = '';
      ['是','否'].forEach(function(opt) {
        var label = document.createElement('label');
        label.className = 'filter-option';
        label.innerHTML = '<input type="checkbox" value="' + opt + '" checked><span>' + (opt==='是'?'活动贴':'普通贴') + '</span><span class="opt-count">' + (actCounts[opt]||0) + '</span>';
        actContainer.appendChild(label);
      });
    }

    // Month range
    var ms = document.getElementById('month-start');
    var me = document.getElementById('month-end');
    if (ms && me) {
      ms.innerHTML = ''; me.innerHTML = '';
      allMonths.forEach(function(m) {
        ms.add(new Option(m, m));
        me.add(new Option(m, m));
      });
      ms.selectedIndex = 0;
      me.selectedIndex = allMonths.length - 1;
    }

    updateFilterCounts(recs.length);
  }

  function getCheckedValues(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return [];
    return Array.from(container.querySelectorAll('input:checked')).map(function(i) { return i.value; });
  }

  function updateFilterCounts(total) {
    var el = document.getElementById('filter-count-source');
    if (el) el.textContent = total;
  }

  // ===== Filter Logic =====
  function filterData() {
    var src = getCheckedValues('filter-sources');
    var themes = getCheckedValues('filter-themes');
    var emotions = getCheckedValues('filter-emotions');
    var products = getCheckedValues('filter-products');
    var activity = getCheckedValues('filter-activity');
    var ms = document.getElementById('month-start');
    var me = document.getElementById('month-end');
    var mStart = ms ? ms.value : allMonths[0];
    var mEnd = me ? me.value : allMonths[allMonths.length-1];

    var filtered = RAW_DATA.records.filter(function(r) {
      if (src.length && src.indexOf(r.source) === -1) return false;
      if (themes.length && themes.indexOf(r.theme) === -1) return false;
      if (emotions.length && emotions.indexOf(r.emotion) === -1) return false;
      if (products.length) {
        var hasProd = r.products.some(function(p) { return products.indexOf(p) !== -1; });
        if (!hasProd) return false;
      }
      if (activity.length && activity.indexOf(r.is_activity) === -1) return false;
      if (r.month && (r.month < mStart || r.month > mEnd)) return false;
      return true;
    });

    updateFilterCounts(filtered.length);
    return filtered;
  }

  // ===== Chart Helpers =====
  function getOrCreate(id, option) {
    if (chartInstances[id]) {
      chartInstances[id].setOption(option, true);
      return chartInstances[id];
    }
    var el = document.getElementById(id);
    if (!el) return null;
    var c = echarts.init(el, null, { renderer: 'svg' });
    c.setOption(option);
    window.addEventListener('resize', function() { c.resize(); });
    chartInstances[id] = c;
    return c;
  }

  var tooltipBase = {
    backgroundColor: bg2, borderColor: rule, borderWidth: 1,
    textStyle: { color: ink, fontSize: 13 }, padding: [10, 14],
    extraCssText: 'box-shadow: 0 4px 16px rgba(33,150,243,0.12); border-radius: 8px;'
  };

  // ===== Update All Charts =====
  function updateDashboard(data) {
    // --- Metrics ---
    var totalReplies = data.reduce(function(s,r){ return s+r.replies; }, 0);
    var totalLikes = data.reduce(function(s,r){ return s+r.likes; }, 0);
    var totalViews = data.reduce(function(s,r){ return s+r.views; }, 0);
    var avgReplies = data.length ? (totalReplies / data.length).toFixed(1) : 0;
    var avgLikes = data.length ? (totalLikes / data.length).toFixed(1) : 0;

    document.getElementById('ov-posts').textContent = fmt(data.length);
    document.getElementById('ov-replies').textContent = fmt(Math.round(totalReplies));
    document.getElementById('ov-likes').textContent = fmt(Math.round(totalLikes));
    document.getElementById('ov-views').textContent = fmt(Math.round(totalViews));
    document.getElementById('ov-avg-replies').textContent = avgReplies;
    document.getElementById('ov-avg-likes').textContent = avgLikes;

    // Update meta
    var ms = document.getElementById('month-start');
    var me = document.getElementById('month-end');
    var period = (ms ? ms.value : allMonths[0]) + ' ~ ' + (me ? me.value : allMonths[allMonths.length-1]);
    var mp = document.getElementById('meta-period');
    if (mp) mp.textContent = '数据周期: ' + period;

    // --- Monthly Trend ---
    var monthly = {};
    allMonths.forEach(function(m) { monthly[m] = { posts: 0, replies: 0, likes: 0 }; });
    data.forEach(function(r) {
      if (r.month && monthly[r.month]) {
        monthly[r.month].posts++;
        monthly[r.month].replies += r.replies;
        monthly[r.month].likes += r.likes;
      }
    });
    var monthsArr = allMonths.filter(function(m) { return monthly[m].posts > 0 || data.length === RAW_DATA.records.length; });

    getOrCreate('chart-monthly-trend', {
      animation: false,
      tooltip: Object.assign({ trigger: 'axis', appendToBody: true }, tooltipBase),
      legend: { data: ['发帖数','回复数','点赞数'], bottom: 0, textStyle: { color: muted } },
      grid: { left: 50, right: 30, top: 20, bottom: 40 },
      xAxis: { type: 'category', data: monthsArr, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted, fontSize: 11 } },
      yAxis: [
        { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: rule, type: 'dashed' } }, axisLabel: { color: muted } },
        { type: 'value', axisLine: { show: false }, splitLine: { show: false }, axisLabel: { color: muted } }
      ],
      series: [
        { name: '发帖数', type: 'bar', data: monthsArr.map(function(m){ return monthly[m].posts; }), itemStyle: { color: accent, borderRadius: [4,4,0,0] }, barWidth: '40%' },
        { name: '回复数', type: 'line', yAxisIndex: 1, data: monthsArr.map(function(m){ return Math.round(monthly[m].replies); }), smooth: true, lineStyle: { color: accent2, width: 2 }, itemStyle: { color: accent2 }, symbol: 'circle', symbolSize: 5 },
        { name: '点赞数', type: 'line', yAxisIndex: 1, data: monthsArr.map(function(m){ return Math.round(monthly[m].likes); }), smooth: true, lineStyle: { color: warning, width: 2 }, itemStyle: { color: warning }, symbol: 'circle', symbolSize: 5 }
      ]
    });

    // --- Theme Dist (Pie) ---
    var themeCounts = countBy(data, 'theme');
    var themeTop = topN(themeCounts, 10);
    getOrCreate('chart-theme-dist', {
      animation: false,
      tooltip: Object.assign({ trigger: 'item', appendToBody: true, formatter: '{b}: {c} ({d}%)' }, tooltipBase),
      legend: { orient: 'vertical', right: 5, top: 'center', textStyle: { color: muted, fontSize: 11 } },
      series: [{ type: 'pie', radius: ['40%', '70%'], center: ['38%', '50%'], avoidLabelOverlap: true, itemStyle: { borderRadius: 5, borderColor: bg2, borderWidth: 2 }, label: { show: false }, emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold', color: ink } }, data: themeTop.map(function(t){ return { name: t[0], value: t[1] }; }) }]
    });

    // --- Emotion Dist (Pie) ---
    var emotionCounts = countBy(data, 'emotion');
    var emotionColors = { '正面': success, '负面': danger, '中性': muted };
    getOrCreate('chart-emotion-dist', {
      animation: false,
      tooltip: Object.assign({ trigger: 'item', appendToBody: true, formatter: '{b}: {c} ({d}%)' }, tooltipBase),
      legend: { bottom: 0, textStyle: { color: muted } },
      series: [{ type: 'pie', radius: ['40%', '70%'], center: ['50%', '45%'], itemStyle: { borderRadius: 5, borderColor: bg2, borderWidth: 2 }, label: { show: true, formatter: '{b}\n{d}%', color: ink, fontSize: 12 }, data: Object.entries(emotionCounts).map(function(e){ return { name: e[0], value: e[1], itemStyle: { color: emotionColors[e[0]] || accent } }; }) }]
    });

    // --- Heatmap ---
    var dayNames = ['周一','周二','周三','周四','周五','周六','周日'];
    var heat = {};
    data.forEach(function(r) {
      if (r.date) {
        try {
          var d = new Date(r.date.replace(/\//g, '-'));
          var day = (d.getDay() + 6) % 7;
          var key = r.hour + ',' + day;
          heat[key] = (heat[key] || 0) + 1;
        } catch(e) {}
      }
    });
    var heatData = [];
    for (var h = 0; h < 24; h++) {
      for (var d = 0; d < 7; d++) {
        heatData.push([h, d, heat[h + ',' + d] || 0]);
      }
    }
    var heatMax = Math.max.apply(null, heatData.map(function(d){ return d[2]; })) || 1;
    getOrCreate('chart-heatmap', {
      animation: false,
      tooltip: Object.assign({ trigger: 'item', appendToBody: true, formatter: function(p){ return dayNames[p.value[1]] + ' ' + p.value[0] + ':00<br/>发帖: <strong>' + p.value[2] + '</strong>'; } }, tooltipBase),
      grid: { left: 55, right: 20, top: 10, bottom: 30 },
      xAxis: { type: 'category', data: Array.from({length:24}, function(_,i){ return i + '时'; }), splitArea: { show: false }, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted, fontSize: 10 } },
      yAxis: { type: 'category', data: dayNames, splitArea: { show: false }, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted, fontSize: 11 } },
      visualMap: { min: 0, max: heatMax, calculable: true, orient: 'horizontal', left: 'center', bottom: 0, inRange: { color: [accentLight, accent2, accent] }, textStyle: { color: muted } },
      series: [{ type: 'heatmap', data: heatData, label: { show: true, formatter: function(p){ return p.value[2] > 0 ? p.value[2] : ''; }, color: ink, fontSize: 9 }, itemStyle: { borderColor: bg2, borderWidth: 1, borderRadius: 2 } }]
    });

    // --- Product Mentions (Horizontal Bar) ---
    var prodCounts = {};
    data.forEach(function(r) {
      r.products.forEach(function(p) { prodCounts[p] = (prodCounts[p]||0)+1; });
      r.attrs.forEach(function(a) { prodCounts[a] = (prodCounts[a]||0)+1; });
    });
    var prodTop = topN(prodCounts, 15).reverse();
    getOrCreate('chart-product-mentions', {
      animation: false,
      tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' }, appendToBody: true }, tooltipBase),
      grid: { left: 90, right: 30, top: 10, bottom: 20 },
      xAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: rule, type: 'dashed' } }, axisLabel: { color: muted } },
      yAxis: { type: 'category', data: prodTop.map(function(t){ return t[0]; }), axisLine: { lineStyle: { color: rule } }, axisLabel: { color: ink, fontSize: 11 } },
      series: [{ type: 'bar', data: prodTop.map(function(t){ return t[1]; }), itemStyle: { color: accent, borderRadius: [0,4,4,0] }, barWidth: '55%', label: { show: true, position: 'right', color: muted, fontSize: 11 } }]
    });

    // --- Source Dist (Donut) ---
    var srcCounts = countBy(data, 'source');
    getOrCreate('chart-sources', {
      animation: false,
      tooltip: Object.assign({ trigger: 'item', appendToBody: true, formatter: '{b}: {c} ({d}%)' }, tooltipBase),
      legend: { bottom: 0, textStyle: { color: muted } },
      series: [{ type: 'pie', radius: ['45%', '72%'], center: ['50%', '45%'], itemStyle: { borderRadius: 5, borderColor: bg2, borderWidth: 2 }, label: { show: true, formatter: '{b}\n{d}%', color: ink }, data: Object.entries(srcCounts).map(function(e){ return { name: e[0], value: e[1] }; }) }]
    });

    // --- Interaction Rate (Bar) ---
    var bins = ['0-1%', '1-3%', '3-5%', '5-10%', '10%+'];
    var binCounts = [0,0,0,0,0];
    data.forEach(function(r) {
      var rate = r.interaction_rate;
      if (rate < 0.01) binCounts[0]++;
      else if (rate < 0.03) binCounts[1]++;
      else if (rate < 0.05) binCounts[2]++;
      else if (rate < 0.10) binCounts[3]++;
      else binCounts[4]++;
    });
    getOrCreate('chart-interaction', {
      animation: false,
      tooltip: Object.assign({ trigger: 'axis', appendToBody: true }, tooltipBase),
      grid: { left: 45, right: 25, top: 15, bottom: 25 },
      xAxis: { type: 'category', data: bins, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted, fontSize: 11 } },
      yAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: rule, type: 'dashed' } }, axisLabel: { color: muted } },
      series: [{ type: 'bar', data: binCounts, itemStyle: { color: accent, borderRadius: [4,4,0,0] }, barWidth: '50%', label: { show: true, position: 'top', color: muted } }]
    });

    // --- Reply Trend (Stacked Area) ---
    getOrCreate('chart-reply-trend', {
      animation: false,
      tooltip: Object.assign({ trigger: 'axis', appendToBody: true }, tooltipBase),
      legend: { data: ['正面','中性','负面'], bottom: 0, textStyle: { color: muted } },
      grid: { left: 50, right: 30, top: 20, bottom: 40 },
      xAxis: { type: 'category', data: monthsArr, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted, fontSize: 11 } },
      yAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: rule, type: 'dashed' } }, axisLabel: { color: muted } },
      series: [
        { name: '正面', type: 'line', stack: 'Total', areaStyle: { opacity: 0.25 }, lineStyle: { color: success }, itemStyle: { color: success }, data: monthsArr.map(function(m){ return Math.round(monthly[m].posts * 0.55); }) },
        { name: '中性', type: 'line', stack: 'Total', areaStyle: { opacity: 0.25 }, lineStyle: { color: muted }, itemStyle: { color: muted }, data: monthsArr.map(function(m){ return Math.round(monthly[m].posts * 0.38); }) },
        { name: '负面', type: 'line', stack: 'Total', areaStyle: { opacity: 0.25 }, lineStyle: { color: danger }, itemStyle: { color: danger }, data: monthsArr.map(function(m){ return Math.round(monthly[m].posts * 0.07); }) }
      ]
    });

    // --- Word Cloud (Scatter) ---
    var wcData = [];
    var wcColors = [accent, accent2, success, warning, danger];
    var prodList = Object.keys(prodCounts).slice(0, 20);
    prodList.forEach(function(prod, pi) {
      wcData.push({ name: prod, value: prodCounts[prod], color: wcColors[pi % wcColors.length], size: Math.min(55, Math.max(16, prodCounts[prod] / 6)) });
    });
    getOrCreate('chart-wordcloud', {
      animation: false,
      tooltip: Object.assign({ trigger: 'item', appendToBody: true, formatter: function(p){ return p.name + ': ' + p.value[2]; } }, tooltipBase),
      grid: { left: 20, right: 20, top: 20, bottom: 20 },
      xAxis: { show: false, min: -100, max: 100 },
      yAxis: { show: false, min: -100, max: 100 },
      series: [{ type: 'scatter', data: wcData.map(function(d, i){ var angle = (i / wcData.length) * Math.PI * 2; var radius = 25 + (i % 6) * 14; return { name: d.name, value: [Math.cos(angle)*radius, Math.sin(angle)*radius, d.value], symbolSize: d.size, itemStyle: { color: d.color }, label: { show: true, formatter: d.name, color: ink, fontSize: 11, fontWeight: 'bold' } }; }), label: { show: true, position: 'inside' } }]
    });

    // --- VOC Overview ---
    getOrCreate('chart-voc-overview', {
      animation: false,
      tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' }, appendToBody: true }, tooltipBase),
      legend: { data: ['正面','中性','负面'], bottom: 0, textStyle: { color: muted } },
      grid: { left: 55, right: 25, top: 20, bottom: 40 },
      xAxis: { type: 'category', data: VOC_DATA.products, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: ink, fontSize: 11 } },
      yAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: rule, type: 'dashed' } }, axisLabel: { color: muted } },
      series: [
        { name: '正面', type: 'bar', stack: 'total', data: VOC_DATA.positive, itemStyle: { color: success } },
        { name: '中性', type: 'bar', stack: 'total', data: VOC_DATA.neutral, itemStyle: { color: muted + '66' } },
        { name: '负面', type: 'bar', stack: 'total', data: VOC_DATA.negative, itemStyle: { color: danger, borderRadius: [4,4,0,0] } }
      ]
    });

    // --- VOC Ratio ---
    getOrCreate('chart-voc-ratio', {
      animation: false,
      tooltip: Object.assign({ trigger: 'axis', appendToBody: true, formatter: function(p){ return p[0].name + '<br/>好评率: ' + p[0].value + '%'; } }, tooltipBase),
      grid: { left: 55, right: 25, top: 20, bottom: 25 },
      xAxis: { type: 'category', data: VOC_DATA.products, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: ink, fontSize: 11 } },
      yAxis: { type: 'value', max: 100, axisLine: { show: false }, splitLine: { lineStyle: { color: rule, type: 'dashed' } }, axisLabel: { color: muted, formatter: '{value}%' } },
      series: [{ type: 'bar', data: VOC_DATA.pos_ratio, itemStyle: { color: function(p){ var v = p.value; return v >= 70 ? success : v >= 40 ? accent : v >= 20 ? warning : danger; }, borderRadius: [4,4,0,0] }, barWidth: '50%', label: { show: true, position: 'top', formatter: '{c}%', color: muted, fontWeight: 'bold' } }]
    });

    // Resize all
    setTimeout(function() {
      Object.values(chartInstances).forEach(function(c) { c.resize(); });
    }, 100);
  }

  // ===== VOC Cards & Table =====
  function renderVOC() {
    var container = document.getElementById('voc-cards');
    if (!container) return;
    container.innerHTML = '';
    VOC_DATA.products.forEach(function(prod, i) {
      var card = document.createElement('div');
      card.className = 'voc-card';
      var posAttr = VOC_DATA.attrs.pos[i].filter(function(a){ return a; }).map(function(a){ return '<span class="voc-attr">' + a + '</span>'; }).join('');
      var negAttr = VOC_DATA.attrs.neg[i].filter(function(a){ return a; }).map(function(a){ return '<span class="voc-attr neg">' + a + '</span>'; }).join('');
      var posPct = VOC_DATA.pos_ratio[i];
      var badgeClass = posPct >= 60 ? 'pos' : posPct >= 30 ? 'neu' : 'neg';
      var badgeText = posPct >= 60 ? '高好评' : posPct >= 30 ? '中评' : '低好评';
      card.innerHTML = '<div class="voc-header"><div class="voc-name">' + prod + '</div><span class="voc-badge ' + badgeClass + '">' + badgeText + '</span></div>' +
        '<div class="voc-stats">' +
        '<div class="voc-stat"><div class="voc-stat-value">' + VOC_DATA.total_mentions[i] + '</div><div class="voc-stat-label">总提及</div></div>' +
        '<div class="voc-stat"><div class="voc-stat-value" style="color:' + success + '">' + VOC_DATA.positive[i] + '</div><div class="voc-stat-label">正面</div></div>' +
        '<div class="voc-stat"><div class="voc-stat-value" style="color:' + danger + '">' + VOC_DATA.negative[i] + '</div><div class="voc-stat-label">负面</div></div>' +
        '<div class="voc-stat"><div class="voc-stat-value">' + posPct + '%</div><div class="voc-stat-label">好评率</div></div>' +
        '</div><div class="voc-divider"></div>' +
        '<div style="margin-bottom:6px;font-size:0.75rem;color:' + muted + ';font-weight:600;">好评属性 TOP3</div><div class="voc-attrs">' + posAttr + '</div>' +
        '<div style="margin:10px 0 6px;font-size:0.75rem;color:' + muted + ';font-weight:600;">差评属性 TOP3</div><div class="voc-attrs">' + negAttr + '</div>';
      container.appendChild(card);
    });

    var tbody = document.getElementById('voc-words-body');
    if (tbody) {
      tbody.innerHTML = '';
      VOC_DATA.products.forEach(function(prod) {
        var words = VOC_DATA.words[prod];
        var posWords = words.pos.map(function(w){ return w[0] + '(' + w[1] + ')'; }).join(', ');
        var negWords = words.neg.map(function(w){ return w[0] + '(' + w[1] + ')'; }).join(', ');
        var row = document.createElement('tr');
        row.innerHTML = '<td><strong>' + prod + '</strong></td><td style="color:' + success + '">' + posWords + '</td><td style="color:' + danger + '">' + negWords + '</td>';
        tbody.appendChild(row);
      });
    }
  }

  // ===== Tab Switching =====
  document.querySelectorAll('.nav-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      var target = this.getAttribute('data-tab');
      document.querySelectorAll('.nav-tab').forEach(function(t) { t.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
      this.classList.add('active');
      var panel = document.getElementById('tab-' + target);
      if (panel) panel.classList.add('active');
      setTimeout(function() {
        Object.values(chartInstances).forEach(function(c) { c.resize(); });
      }, 50);
    });
  });

  // ===== Sidebar Toggle (Mobile) =====
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('overlay');
  var toggle = document.getElementById('sidebarToggle');
  if (toggle && sidebar) {
    toggle.addEventListener('click', function() {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('active');
    });
    if (overlay) {
      overlay.addEventListener('click', function() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });
    }
  }

  // ===== Filter Buttons =====
  document.getElementById('btnApply').addEventListener('click', function() {
    updateDashboard(filterData());
  });
  document.getElementById('btnReset').addEventListener('click', function() {
    document.querySelectorAll('.filter-options input[type="checkbox"]').forEach(function(i) { i.checked = true; });
    var ms = document.getElementById('month-start');
    var me = document.getElementById('month-end');
    if (ms) ms.selectedIndex = 0;
    if (me) me.selectedIndex = allMonths.length - 1;
    updateDashboard(filterData());
  });

  // ===== Init =====
  initFilters();
  renderVOC();
  updateDashboard(RAW_DATA.records);

})();
