/**
 * Deep Neural Network Interactive Visualizer (LunarLandNet).
 * Renders nodes, activation values, synaptic connections, and forward signal flow.
 */

export class NetworkVisualizer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.evalData = null;
    this.pulsePhase = 0;

    this.layerSizes = [8, 16, 12, 8, 5];
    this.layerLabels = [
      'Entrada (8)',
      'Oculta 1 (16)',
      'Oculta 2 (12)',
      'Oculta 3 (8)',
      'Salida (5)'
    ];

    this.inputFeatureNames = [
      'Pendiente',
      'Rugosidad',
      'Luz Solar',
      'Elev. Sol',
      'Comms DTE',
      'Brecha Sombra',
      'Dist. Hielo',
      'Altitud'
    ];

    this.outputFeatureNames = [
      'Seguridad',
      'Terreno',
      'Energía',
      'Comms',
      'Ciencia'
    ];

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width || 480;
    this.height = rect.height || 220;
    this.dpr = window.devicePixelRatio || 1;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.calculateNodePositions();
  }

  calculateNodePositions() {
    this.nodes = [];
    const numLayers = this.layerSizes.length;
    const paddingX = 45 * this.dpr;
    const paddingY = 25 * this.dpr;
    const availWidth = this.canvas.width - paddingX * 2;
    const availHeight = this.canvas.height - paddingY * 2;

    for (let l = 0; l < numLayers; l++) {
      const count = this.layerSizes[l];
      const x = paddingX + (l / (numLayers - 1)) * availWidth;
      const layerNodes = [];

      for (let n = 0; n < count; n++) {
        const y = paddingY + ((n + 0.5) / count) * availHeight;
        layerNodes.push({ x, y, layer: l, index: n, activation: 0.5 });
      }
      this.nodes.push(layerNodes);
    }
  }

  update(evalData) {
    this.evalData = evalData;
    if (!evalData || !evalData.activations) return;

    // Map activations to nodes
    const acts = evalData.activations;
    if (this.nodes[0]) {
      this.nodes[0].forEach((node, i) => (node.activation = acts.input[i] || 0));
    }
    if (this.nodes[1]) {
      this.nodes[1].forEach((node, i) => (node.activation = acts.layer1[i] || 0));
    }
    if (this.nodes[2]) {
      this.nodes[2].forEach((node, i) => (node.activation = acts.layer2[i] || 0));
    }
    if (this.nodes[3]) {
      this.nodes[3].forEach((node, i) => (node.activation = acts.layer3[i] || 0));
    }
    if (this.nodes[4]) {
      this.nodes[4].forEach((node, i) => (node.activation = acts.output[i] || 0));
    }
  }

  animate() {
    this.pulsePhase = (this.pulsePhase + 0.04) % (Math.PI * 2);
    this.draw();
    requestAnimationFrame(this.animate);
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (!this.nodes || this.nodes.length === 0) return;

    // Draw Synaptic Connections between adjacent layers
    for (let l = 0; l < this.nodes.length - 1; l++) {
      const currentLayer = this.nodes[l];
      const nextLayer = this.nodes[l + 1];

      for (let i = 0; i < currentLayer.length; i++) {
        const from = currentLayer[i];
        // Connect sparse or all
        for (let j = 0; j < nextLayer.length; j++) {
          const to = nextLayer[j];
          const weightSim = Math.sin((i + 1) * (j + 1) * 0.7);
          const isPositive = weightSim > 0;

          // Synapse stroke
          const alpha = 0.08 + Math.abs(weightSim) * 0.12;
          ctx.strokeStyle = isPositive ? `rgba(0, 229, 255, ${alpha})` : `rgba(255, 64, 129, ${alpha})`;
          ctx.lineWidth = (0.6 + Math.abs(weightSim) * 0.8) * this.dpr;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();

          // Animated synaptic pulse signal
          const pulseOffset = (this.pulsePhase + l * 1.2 + (i + j) * 0.3) % (Math.PI * 2);
          if (pulseOffset > 0 && pulseOffset < 1.0) {
            const frac = pulseOffset;
            const px = from.x + (to.x - from.x) * frac;
            const py = from.y + (to.y - from.y) * frac;
            ctx.fillStyle = isPositive ? 'rgba(0, 255, 204, 0.7)' : 'rgba(255, 82, 82, 0.7)';
            ctx.beginPath();
            ctx.arc(px, py, 1.2 * this.dpr, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // Draw Nodes
    for (let l = 0; l < this.nodes.length; l++) {
      const layer = this.nodes[l];
      const isInput = l === 0;
      const isOutput = l === this.nodes.length - 1;
      const nodeRadius = (isInput || isOutput ? 4.5 : 3.2) * this.dpr;

      layer.forEach((node) => {
        const act = Math.max(0, Math.min(1, node.activation));

        // Node Glow
        if (act > 0.4) {
          const glowGrad = ctx.createRadialGradient(node.x, node.y, 1, node.x, node.y, nodeRadius * 2.2);
          glowGrad.addColorStop(0, `rgba(0, 229, 255, ${act * 0.5})`);
          glowGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeRadius * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Node Circle
        ctx.fillStyle = isOutput && node.index === 0
          ? (this.evalData && this.evalData.scorePercent >= 75 ? '#00e676' : this.evalData && this.evalData.scorePercent >= 50 ? '#ff9100' : '#ff1744')
          : `rgba(${Math.round(20 + act * 200)}, ${Math.round(180 + act * 75)}, 255, 0.95)`;

        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8 * this.dpr;
        ctx.stroke();

        // Labels for Input Nodes
        if (isInput) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.font = `${8 * this.dpr}px monospace`;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(this.inputFeatureNames[node.index] || '', node.x - 7 * this.dpr, node.y);
        }

        // Labels for Output Nodes
        if (isOutput) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.font = `bold ${8.5 * this.dpr}px monospace`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          const name = this.outputFeatureNames[node.index] || '';
          const val = `${Math.round(act * 100)}%`;
          ctx.fillText(`${name} (${val})`, node.x + 7 * this.dpr, node.y);
        }
      });
    }

    // Top Layer Column Headers
    ctx.fillStyle = 'rgba(0, 229, 255, 0.75)';
    ctx.font = `bold ${8.5 * this.dpr}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (let l = 0; l < this.nodes.length; l++) {
      const headerX = this.nodes[l][0].x;
      ctx.fillText(this.layerLabels[l], headerX, 18 * this.dpr);
    }
  }
}
