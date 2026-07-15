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
  var allMonths = RAW_DATA.months.slice();
  var modules = RAW_DATA.modules;

  // ===== Utils =====
  function fmt(n) { return n.toLocaleString('zh-CN'); }
  function countBy(arr, key) {
    var c = {};
    arr.forEach(function(r) { var v = r[key]; c[v] = (c[v] || 0) + 1; });
    return c;
  }
  function countByTags(arr, dim) {
    var c = {};
    arr.forEach(function(r) {
      (r[dim] || []).forEach(function(t) { c[t] = (c[t] || 0) + 1; });
    });
    return c;
  }
  function topN(obj, n) {
    return Object.entries(obj).sort(function(a,b){ return b[1]-a[1]; }).slice(0, n);
  }

  // ===== Module Toggle =====
  function initModuleToggles() {
    document.querySelectorAll('.module-toggle').forEach(function(el) {
      el.addEventListener('click', function() {
        var target = document.getElementById('module-' + this.getAttribute('data-module'));
        if (target) {
          target.classList.toggle('collapsed');
          this.classList.toggle('collapsed');
        }
      });
    });
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

    // 基础筛选
    var srcCounts = countBy(recs, 'source');
    createOptions('filter-sources', RAW_DATA.sources, srcCounts);

    var typeCounts = countBy(recs, 'data_type');
    createOptions('filter-data-types', RAW_DATA.data_types, typeCounts);

    // 月份范围
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

    // 标签维度筛选（按模块分组）
    Object.keys(modules).forEach(function(moduleName) {
      var dims = modules[moduleName];
      dims.forEach(function(dim) {
        var containerId = 'filter-' + dim;
        var opts = RAW_DATA.options[dim] || [];
        var counts = countByTags(recs, dim);
        createOptions(containerId, opts, counts);
      });
    });

    updateFilterCounts(recs.length);
    initModuleToggles();
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
    var dataTypes = getCheckedValues('filter-data-types');
    var ms = document.getElementById('month-start');
    var me = document.getElementById('month-end');
    var mStart = ms ? ms.value : allMonths[0];
    var mEnd = me ? me.value : allMonths[allMonths.length-1];

    // 收集所有标签维度的筛选条件
    var tagFilters = {};
    Object.keys(modules).forEach(function(moduleName) {
      modules[moduleName].forEach(function(dim) {
        var checked = getCheckedValues('filter-' + dim);
        if (checked.length > 0) {
          tagFilters[dim] = checked;
        }
      });
    });

    var filtered = RAW_DATA.records.filter(function(r) {
      if (src.length && src.indexOf(r.source) === -1) return false;
      if (dataTypes.length && dataTypes.indexOf(r.data_type) === -1) return false;
      if (r.month && (r.month < mStart || r.month > mEnd)) return false;

      // 标签筛选：每个维度内OR，维度间AND
      for (var dim in tagFilters) {
        var recordTags = r[dim] || [];
        var hasMatch = recordTags.some(function(t) { return tagFilters[dim].indexOf(t) !== -1; });
        if (!hasMatch) return false;
      }
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

    // --- Content Theme Dist (Pie) ---
    var themeCounts = countByTags(data, '内容主题');
    var themeTop = topN(themeCounts, 12);
    getOrCreate('chart-theme-dist', {
      animation: false,
      tooltip: Object.assign({ trigger: 'item', appendToBody: true, formatter: '{b}: {c} ({d}%)' }, tooltipBase),
      legend: { orient: 'vertical', right: 5, top: 'center', textStyle: { color: muted, fontSize: 11 } },
      series: [{ type: 'pie', radius: ['40%', '70%'], center: ['38%', '50%'], avoidLabelOverlap: true, itemStyle: { borderRadius: 5, borderColor: bg2, borderWidth: 2 }, label: { show: false }, emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold', color: ink } }, data: themeTop.map(function(t){ return { name: t[0], value: t[1] }; }) }]
    });

    // --- COC Product Mentions (Horizontal Bar) ---
    var cocCounts = countByTags(data, 'COC品牌产品');
    var cocTop = topN(cocCounts, 10).reverse();
    getOrCreate('chart-coc-products', {
      animation: false,
      tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' }, appendToBody: true }, tooltipBase),
      grid: { left: 80, right: 30, top: 10, bottom: 20 },
      xAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: rule, type: 'dashed' } }, axisLabel: { color: muted } },
      yAxis: { type: 'category', data: cocTop.map(function(t){ return t[0]; }), axisLine: { lineStyle: { color: rule } }, axisLabel: { color: ink, fontSize: 11 } },
      series: [{ type: 'bar', data: cocTop.map(function(t){ return t[1]; }), itemStyle: { color: accent, borderRadius: [0,4,4,0] }, barWidth: '55%', label: { show: true, position: 'right', color: muted, fontSize: 11 } }]
    });

    // --- User Persona (Radar or Stacked Bar) ---
    var personaDims = ['人口统计类','使用经验类','心理特征类','社群归属类'];
    var personaData = personaDims.map(function(dim) {
      var cnt = countByTags(data, dim);
      return Object.values(cnt).reduce(function(s,v){ return s+v; }, 0);
    });
    getOrCreate('chart-persona', {
      animation: false,
      tooltip: Object.assign({ trigger: 'axis', appendToBody: true }, tooltipBase),
      grid: { left: 50, right: 30, top: 20, bottom: 30 },
      xAxis: { type: 'category', data: personaDims, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: ink, fontSize: 11 } },
      yAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: rule, type: 'dashed' } }, axisLabel: { color: muted } },
      series: [{ type: 'bar', data: personaData, itemStyle: { color: accent, borderRadius: [4,4,0,0] }, barWidth: '50%', label: { show: true, position: 'top', color: muted } }]
    });

    // --- Purchase Purpose (Pie) ---
    var purposeDims = ['功能性目的','情感目的','社交目的'];
    var purposeCounts = {};
    purposeDims.forEach(function(dim) {
      purposeCounts[dim] = Object.values(countByTags(data, dim)).reduce(function(s,v){ return s+v; }, 0);
    });
    getOrCreate('chart-purpose', {
      animation: false,
      tooltip: Object.assign({ trigger: 'item', appendToBody: true, formatter: '{b}: {c} ({d}%)' }, tooltipBase),
      legend: { bottom: 0, textStyle: { color: muted } },
      series: [{ type: 'pie', radius: ['40%', '70%'], center: ['50%', '45%'], itemStyle: { borderRadius: 5, borderColor: bg2, borderWidth: 2 }, label: { show: true, formatter: '{b}\n{d}%', color: ink, fontSize: 12 }, data: Object.entries(purposeCounts).map(function(e){ return { name: e[0], value: e[1] }; }) }]
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

    // --- Source Dist (Donut) ---
    var srcCounts = countBy(data, 'source');
    getOrCreate('chart-sources', {
      animation: false,
      tooltip: Object.assign({ trigger: 'item', appendToBody: true, formatter: '{b}: {c} ({d}%)' }, tooltipBase),
      legend: { bottom: 0, textStyle: { color: muted } },
      series: [{ type: 'pie', radius: ['45%', '72%'], center: ['50%', '45%'], itemStyle: { borderRadius: 5, borderColor: bg2, borderWidth: 2 }, label: { show: true, formatter: '{b}\n{d}%', color: ink }, data: Object.entries(srcCounts).map(function(e){ return { name: e[0], value: e[1] }; }) }]
    });

    // --- Data Type Dist ---
    var typeCounts = countBy(data, 'data_type');
    getOrCreate('chart-data-types', {
      animation: false,
      tooltip: Object.assign({ trigger: 'item', appendToBody: true, formatter: '{b}: {c} ({d}%)' }, tooltipBase),
      legend: { bottom: 0, textStyle: { color: muted } },
      series: [{ type: 'pie', radius: ['40%', '65%'], center: ['50%', '45%'], itemStyle: { borderRadius: 5, borderColor: bg2, borderWidth: 2 }, label: { show: true, formatter: '{b}\n{d}%', color: ink, fontSize: 12 }, data: Object.entries(typeCounts).map(function(e){ return { name: e[0], value: e[1] }; }) }]
    });

    // --- Purchase Motivation (Horizontal Bar) ---
    var motiDims = ['促销刺激','功能驱动','幻想驱动','情感驱动','替代升级驱动','社交驱动'];
    var motiData = motiDims.map(function(dim) {
      return Object.values(countByTags(data, dim)).reduce(function(s,v){ return s+v; }, 0);
    });
    getOrCreate('chart-motivation', {
      animation: false,
      tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' }, appendToBody: true }, tooltipBase),
      grid: { left: 90, right: 30, top: 10, bottom: 20 },
      xAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: rule, type: 'dashed' } }, axisLabel: { color: muted } },
      yAxis: { type: 'category', data: motiDims, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: ink, fontSize: 11 } },
      series: [{ type: 'bar', data: motiData, itemStyle: { color: accent, borderRadius: [0,4,4,0] }, barWidth: '55%', label: { show: true, position: 'right', color: muted, fontSize: 11 } }]
    });

    // --- Usage Obstacles (Horizontal Bar) ---
    var obstDims = ['产品使用','产品保养','伴侣关系','场景障碍','心理状态'];
    var obstData = obstDims.map(function(dim) {
      return Object.values(countByTags(data, dim)).reduce(function(s,v){ return s+v; }, 0);
    });
    getOrCreate('chart-obstacles', {
      animation: false,
      tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' }, appendToBody: true }, tooltipBase),
      grid: { left: 70, right: 30, top: 10, bottom: 20 },
      xAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: rule, type: 'dashed' } }, axisLabel: { color: muted } },
      yAxis: { type: 'category', data: obstDims, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: ink, fontSize: 11 } },
      series: [{ type: 'bar', data: obstData, itemStyle: { color: warning, borderRadius: [0,4,4,0] }, barWidth: '55%', label: { show: true, position: 'right', color: muted, fontSize: 11 } }]
    });

    // --- Improvement Suggestions (Horizontal Bar) ---
    var impDims = ['产品设计','体验优化','功能增强','服务支持'];
    var impData = impDims.map(function(dim) {
      return Object.values(countByTags(data, dim)).reduce(function(s,v){ return s+v; }, 0);
    });
    getOrCreate('chart-improvement', {
      animation: false,
      tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' }, appendToBody: true }, tooltipBase),
      grid: { left: 70, right: 30, top: 10, bottom: 20 },
      xAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: rule, type: 'dashed' } }, axisLabel: { color: muted } },
      yAxis: { type: 'category', data: impDims, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: ink, fontSize: 11 } },
      series: [{ type: 'bar', data: impData, itemStyle: { color: success, borderRadius: [0,4,4,0] }, barWidth: '55%', label: { show: true, position: 'right', color: muted, fontSize: 11 } }]
    });

    // --- Top Tags Word Cloud ---
    var allTagCounts = {};
    Object.keys(modules).forEach(function(mod) {
      modules[mod].forEach(function(dim) {
        var cnt = countByTags(data, dim);
        Object.entries(cnt).forEach(function(e) {
          allTagCounts[e[0]] = (allTagCounts[e[0]] || 0) + e[1];
        });
      });
    });
    var wcTop = topN(allTagCounts, 25);
    var wcData = wcTop.map(function(t, i) {
      var sizes = [55, 48, 42, 38, 34, 30, 28, 26, 24, 22, 20, 18, 16, 16, 14, 14, 14, 12, 12, 12, 12, 12, 12, 12, 12];
      var colors = [accent, accent2, success, warning, danger];
      var angle = (i / wcTop.length) * Math.PI * 2;
      var radius = 20 + (i % 7) * 12;
      return {
        name: t[0], value: [Math.cos(angle)*radius, Math.sin(angle)*radius, t[1]],
        symbolSize: sizes[i] || 12,
        itemStyle: { color: colors[i % colors.length] },
        label: { show: true, formatter: t[0], color: ink, fontSize: Math.max(10, (sizes[i]||12)/2), fontWeight: 'bold' }
      };
    });
    getOrCreate('chart-wordcloud', {
      animation: false,
      tooltip: Object.assign({ trigger: 'item', appendToBody: true, formatter: function(p){ return p.name + ': ' + p.value[2]; } }, tooltipBase),
      grid: { left: 20, right: 20, top: 20, bottom: 20 },
      xAxis: { show: false, min: -100, max: 100 },
      yAxis: { show: false, min: -100, max: 100 },
      series: [{ type: 'scatter', data: wcData, label: { show: true, position: 'inside' } }]
    });

    // --- VOC: Product mentions with related tags ---
    updateVOC(data);

    // Resize all
    setTimeout(function() {
      Object.values(chartInstances).forEach(function(c) { c.resize(); });
    }, 100);
  }

  // ===== VOC Section =====
  function updateVOC(data) {
    var container = document.getElementById('voc-cards');
    if (!container) return;
    container.innerHTML = '';

    var cocProducts = RAW_DATA.options['COC品牌产品'] || [];
    cocProducts.forEach(function(prod) {
      var cnt = 0;
      var relatedTags = {};
      data.forEach(function(r) {
        var tags = r['COC品牌产品'] || [];
        if (tags.indexOf(prod) !== -1) {
          cnt++;
          // 收集相关标签
          ['使用感受讨论','产品质量问题','功能体验良好','改进产品设计','优化材质选择'].forEach(function(dim) {
            (r[dim] || []).forEach(function(t) {
              relatedTags[t] = (relatedTags[t] || 0) + 1;
            });
          });
        }
      });

      var topRelated = topN(relatedTags, 5).map(function(t){ return t[0]; });

      var card = document.createElement('div');
      card.className = 'voc-card';
      card.innerHTML = '<div class="voc-header"><div class="voc-name">' + prod + '</div><span class="voc-badge pos">提及 ' + cnt + '</span></div>' +
        '<div style="font-size:0.75rem;color:' + muted + ';margin-bottom:8px;">相关标签 TOP5</div>' +
        '<div class="voc-attrs">' + topRelated.map(function(a){ return '<span class="voc-attr">' + a + '</span>'; }).join('') + '</div>';
      container.appendChild(card);
    });
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
  updateDashboard(RAW_DATA.records);

})();
