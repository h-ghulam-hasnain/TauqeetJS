export const CHART_CSS = `
.tauqeet-chart-container {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    position: relative;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: inherit;
}

.tauqeet-chart-svg {
    width: 100%;
    height: auto;
    transform: rotate(0deg);
}

.tauqeet-chart-segment {
    cursor: pointer;
    transition: opacity 0.3s, transform 0.3s;
    stroke: rgba(15, 23, 42, 0.2);
    stroke-width: 0.5;
}

.tauqeet-chart-segment:hover {
    opacity: 0.8;
    transform: scale(1.02);
    transform-origin: center;
}

.tauqeet-chart-tooltip {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    pointer-events: none;
    background: rgba(15, 23, 42, 0.9);
    padding: 1rem;
    border-radius: 1rem;
    border: 1px solid rgba(45, 212, 191, 0.2);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    opacity: 0;
    transition: opacity 0.3s;
    z-index: 10;
    text-align: center;
    min-width: 100px;
}

.tauqeet-chart-tooltip.visible {
    opacity: 1;
}

.tauqeet-tooltip-title {
    font-weight: 800;
    color: #2dd4bf;
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
    display: block;
}

.tauqeet-tooltip-value {
    font-size: 1.1rem;
    font-weight: 700;
    color: white;
    display: block;
}

.tauqeet-legend {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 0.75rem;
    margin-top: 1.5rem;
    text-align: left;
    width: 100%;
}

.tauqeet-legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #94a3b8;
}

.tauqeet-legend-color {
    width: 12px;
    height: 12px;
    border-radius: 3px;
}
`;
