import { PrayerTimesResult } from '../prayer/types/index.js';
import { getChartSegments } from '../prayer/chart.js';
import { CHART_CSS } from './styles.js';

export interface ChartOptions {
  /** Rotation of the chart in degrees. Default: 0 */
  rotation?: number;
  /** Whether to show the legend. Default: true */
  showLegend?: boolean;
  /** Relative radius of the center hole (0-1). Default: 0.45 */
  centerRadius?: number;
  /** Override segment colors. Key is segment name (e.g. 'Fajr', 'Dhuhr') */
  colors?: Record<string, string>;
  /** Custom background color for the donut hole. Default: #0f172a */
  holeColor?: string;
  /** Timezone offset in hours (e.g. 5 for UTC+5). Required for correct segment positions. Default: 0 */
  timezoneOffset?: number;
}

/**
 * Renders a premium 24-hour prayer cycle chart into the target container.
 */
export function renderPrayerChart(
  container: HTMLElement,
  times: PrayerTimesResult,
  options: ChartOptions = {}
): void {
  if (!container) return;

  const {
    rotation = 0,
    showLegend = true,
    centerRadius = 0.45,
    colors = {},
    holeColor = '#0f172a',
    timezoneOffset = 0
  } = options;

  // Inject Styles if not already present
  if (!document.getElementById('tauqeet-chart-styles')) {
    const style = document.createElement('style');
    style.id = 'tauqeet-chart-styles';
    style.textContent = CHART_CSS;
    document.head.appendChild(style);
  }

  // Clear container
  container.innerHTML = `
    <div class="tauqeet-chart-container">
      <svg viewBox="0 0 100 100" class="tauqeet-chart-svg" style="transform: rotate(${rotation}deg)"></svg>
      <div class="tauqeet-chart-tooltip" style="transform: translate(-50%, -50%)">
        <span class="tauqeet-tooltip-title"></span>
        <span class="tauqeet-tooltip-value"></span>
      </div>
    </div>
    ${showLegend ? '<div class="tauqeet-legend"></div>' : ''}
  `;

  const svg = container.querySelector('svg')!;
  const legend = container.querySelector('.tauqeet-legend');
  const tooltip = container.querySelector('.tauqeet-chart-tooltip')!;
  const tTitle = container.querySelector('.tauqeet-tooltip-title')!;
  const tValue = container.querySelector('.tauqeet-tooltip-value')!;

  const segments = getChartSegments(times, timezoneOffset);
  const cx = 50, cy = 50, r = 40;

  // Standard Clockwise 24-hour Mapping (12:00 at Top)
  // 12:00 (Noon)     -> -90° (Top)
  // 18:00 (Sunset)   -> 0°   (Right)
  // 00:00 (Midnight) -> 90°  (Bottom)
  // 06:00 (Sunrise)  -> 180° (Left)
  // Formula: ((h - 12) * 15 - 90) * (Math.PI / 180)
  const getSVGAngle = (h: number) => ((h - 12) * 15 - 90) * (Math.PI / 180);

  segments.forEach(seg => {
    const color = colors[seg.name] || seg.color;
    const sDec = seg.start % 24;
    const duration = seg.end - seg.start;

    const startAngle = getSVGAngle(sDec);
    const endAngle = getSVGAngle(sDec + duration);

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    const largeArc = duration > 12 ? 1 : 0;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`);
    path.setAttribute('fill', color);
    path.setAttribute('class', 'tauqeet-chart-segment');

    const h = Math.floor(duration);
    const m = Math.round((duration - h) * 60);
    const durationStr = `${h}h ${m.toString().padStart(2, '0')}m`;
    const percent = (duration / 24 * 100).toFixed(1) + '%';

    path.addEventListener('mouseenter', () => {
      tTitle.textContent = `${seg.emoji} ${seg.name}`;
      tValue.textContent = (path as any).dataset.mode === 'percent' ? percent : durationStr;
      tooltip.classList.add('visible');
    });

    path.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
    });

    path.addEventListener('click', (e) => {
      e.stopPropagation();
      (path as any).dataset.mode = (path as any).dataset.mode === 'percent' ? 'duration' : 'percent';
      tValue.textContent = (path as any).dataset.mode === 'percent' ? percent : durationStr;
    });

    svg.appendChild(path);

    // Add Label Text inside segment (if duration > 0.6h to avoid clutter)
    if (duration > 0.6) {
      const midAngle = startAngle + (endAngle - startAngle) / 2;
      const lr = r * (centerRadius + (1 - centerRadius) / 2);
      const lx = cx + lr * Math.cos(midAngle);
      const ly = cy + lr * Math.sin(midAngle);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', lx.toString());
      text.setAttribute('y', ly.toString());
      text.setAttribute('fill', 'white');
      text.setAttribute('font-size', '3px');
      text.setAttribute('font-weight', '600');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.setAttribute('pointer-events', 'none');

      // Counter-rotate text so it stays upright regardless of chart rotation
      text.setAttribute('transform', `rotate(${-rotation}, ${lx}, ${ly})`);

      text.textContent = seg.name;
      svg.appendChild(text);
    }

    // Legend
    if (legend) {
      const legItem = document.createElement('div');
      legItem.className = 'tauqeet-legend-item';
      legItem.innerHTML = `<div class="tauqeet-legend-color" style="background:${color}"></div><span>${seg.emoji} ${seg.name}</span>`;
      legend.appendChild(legItem);
    }
  });

  // Center hole (Donut)
  const inner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  inner.setAttribute('cx', cx.toString());
  inner.setAttribute('cy', cy.toString());
  inner.setAttribute('r', (r * centerRadius).toString());
  inner.setAttribute('fill', holeColor);
  svg.appendChild(inner);

  // Clock Face Markings (Fixed to the 24-hour cycle)
  const markings = [
    { label: '12', sub: 'Noon', h: 12 },     // Top
    { label: '18', sub: 'Sunset', h: 18 },   // Right
    { label: '00', sub: 'Midnight', h: 0 },   // Bottom
    { label: '06', sub: 'Sunrise', h: 6 }    // Left
  ];

  markings.forEach(m => {
    const angle = getSVGAngle(m.h);
    // Position markers just inside the center hole
    const markerRadius = r * centerRadius - 3;
    const mx = cx + markerRadius * Math.cos(angle);
    const my = cy + markerRadius * Math.sin(angle);

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('transform', `rotate(${-rotation}, ${mx}, ${my})`);

    const textMain = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textMain.setAttribute('x', mx.toString());
    textMain.setAttribute('y', (my - 1).toString());
    textMain.setAttribute('fill', '#94a3b8'); // text-muted
    textMain.setAttribute('font-size', '4px');
    textMain.setAttribute('font-weight', '700');
    textMain.setAttribute('text-anchor', 'middle');
    textMain.setAttribute('dominant-baseline', 'central');
    textMain.setAttribute('pointer-events', 'none');
    textMain.textContent = m.label;

    const textSub = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textSub.setAttribute('x', mx.toString());
    textSub.setAttribute('y', (my + 2).toString());
    textSub.setAttribute('fill', '#475569'); // darker muted
    textSub.setAttribute('font-size', '2px');
    textSub.setAttribute('font-weight', '500');
    textSub.setAttribute('text-anchor', 'middle');
    textSub.setAttribute('dominant-baseline', 'central');
    textSub.setAttribute('pointer-events', 'none');
    textSub.textContent = m.sub;

    group.appendChild(textMain);
    group.appendChild(textSub);
    svg.appendChild(group);
  });

  // Auto-detect current prayer for intro
  const now = new Date();
  const nowDec = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  const current = segments.find(s => (nowDec >= s.start && nowDec < s.end) || (nowDec + 24 >= s.start && nowDec + 24 < s.end));

  if (current) {
    tTitle.textContent = `${current.emoji} ${current.name}`;
    const dCur = current.end - current.start;
    const hCur = Math.floor(dCur);
    const mCur = Math.round((dCur - hCur) * 60);
    tValue.textContent = `${hCur}h ${mCur.toString().padStart(2, '0')}m`;
    tooltip.classList.add('visible');
  }
}
