import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Network, TrendingUp, Users } from 'lucide-react';

const NodeTypeColors = {
  case: '#0EA5E9',
  client: '#10B981',
  opponent: '#DC2626',
  incident: '#F97316',
  surveyor: '#A855F7',
  party: '#6B7280',
};

const NodeTypeLabels = {
  case: 'Cases',
  client: 'Clients',
  opponent: 'Opponents',
  incident: 'Incidents',
  surveyor: 'Surveyors',
  party: 'Parties',
};

export default function VisualNetworkMap() {
  const canvasRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [highlightedCluster, setHighlightedCluster] = useState(null);

  // Fetch network data
  const { data: networkData, isLoading } = useQuery({
    queryKey: ['networkGraph'],
    queryFn: () => base44.functions.invoke('buildNetworkGraph', {}),
  });

  // Draw network graph
  useEffect(() => {
    if (!networkData?.data || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { nodes, edges } = networkData.data;

    // Set canvas resolution
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Initialize node positions (simple force-directed layout)
    if (!nodes[0]?.x) {
      nodes.forEach((node, idx) => {
        node.x = Math.random() * canvas.width;
        node.y = Math.random() * canvas.height;
        node.vx = 0;
        node.vy = 0;
      });
    }

    // Force-directed simulation
    const simulate = () => {
      const repulsion = 100;
      const attraction = 0.01;
      const damping = 0.85;

      nodes.forEach((node, i) => {
        // Repulsion between nodes
        nodes.forEach((other, j) => {
          if (i !== j) {
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = (repulsion * node.size * other.size) / (distance * distance);
            node.vx += (dx / distance) * force;
            node.vy += (dy / distance) * force;
          }
        });

        // Attraction to connected nodes
        edges.forEach((edge) => {
          if (edge.source === node.id || edge.target === node.id) {
            const other =
              edge.source === node.id
                ? nodes.find((n) => n.id === edge.target)
                : nodes.find((n) => n.id === edge.source);

            if (other) {
              const dx = other.x - node.x;
              const dy = other.y - node.y;
              const distance = Math.sqrt(dx * dx + dy * dy) || 1;
              const force = distance * attraction;
              node.vx += (dx / distance) * force;
              node.vy += (dy / distance) * force;
            }
          }
        });

        // Boundary constraints
        node.x = Math.max(20, Math.min(canvas.width - 20, node.x));
        node.y = Math.max(20, Math.min(canvas.height - 20, node.y));

        // Apply velocity
        node.vx *= damping;
        node.vy *= damping;
        node.x += node.vx;
        node.y += node.vy;
      });
    };

    // Draw function
    const draw = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw edges
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      edges.forEach((edge) => {
        const source = nodes.find((n) => n.id === edge.source);
        const target = nodes.find((n) => n.id === edge.target);

        if (source && target) {
          ctx.beginPath();
          ctx.moveTo(source.x, source.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
        }
      });

      // Draw nodes
      nodes.forEach((node) => {
        const isSelected = selectedNode?.id === node.id;
        const isInCluster =
          highlightedCluster &&
          highlightedCluster.nodes.includes(node.id);

        ctx.fillStyle = isSelected ? '#1e293b' : isInCluster ? node.color : node.color;
        ctx.globalAlpha = isInCluster || !highlightedCluster ? 1 : 0.25;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fill();

        // Label
        if (isSelected || node.size > 6) {
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.globalAlpha = 1;
          ctx.fillText(node.label.substring(0, 12), node.x, node.y + node.size + 14);
        }
      });

      ctx.globalAlpha = 1;
    };

    // Animation loop
    let frameCount = 0;
    const animate = () => {
      if (frameCount < 100) {
        simulate();
        frameCount++;
      }
      draw();
      requestAnimationFrame(animate);
    };

    // Handle click
    const handleCanvasClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const clicked = nodes.find((node) => {
        const dx = node.x - x;
        const dy = node.y - y;
        return Math.sqrt(dx * dx + dy * dy) < node.size * 2;
      });

      setSelectedNode(clicked);
    };

    canvas.addEventListener('click', handleCanvasClick);
    animate();

    return () => canvas.removeEventListener('click', handleCanvasClick);
  }, [networkData, selectedNode, highlightedCluster]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  const stats = networkData?.data?.statistics || {};
  const clusters = stats.clusters || [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Network className="w-8 h-8" />
          Visual Network Map
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Interactive graph showing relationships between cases, clients, incidents and surveyors
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Stats Cards */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">Entities</p>
            <p className="text-3xl font-bold">{stats.total_nodes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">Relationships</p>
            <p className="text-3xl font-bold">{stats.total_edges}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">Clusters</p>
            <p className="text-3xl font-bold">{clusters.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">Top Node</p>
            <p className="text-lg font-bold truncate">
              {stats.top_participants?.[0]?.label || 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Canvas */}
      <Card className="h-[600px]">
        <CardContent className="h-full p-0">
          <canvas
            ref={canvasRef}
            className="w-full h-full bg-white dark:bg-slate-900 rounded-lg cursor-pointer"
            style={{ display: 'block' }}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Participants */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Participants
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.top_participants?.slice(0, 10).map((node) => (
              <div
                key={node.id}
                className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded"
              >
                <p className="text-sm font-medium truncate">{node.label}</p>
                <Badge variant="outline">{node.degree}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Node Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Node Types
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(stats.node_types || {}).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: NodeTypeColors[type] }}
                  />
                  <span className="text-sm">{NodeTypeLabels[type]}</span>
                </div>
                <Badge>{count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Selected Node Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedNode ? 'Selected Node' : 'Click a node'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedNode ? (
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Label:</strong> {selectedNode.label}
                </p>
                <p>
                  <strong>Type:</strong>{' '}
                  <Badge style={{ backgroundColor: selectedNode.color }}>
                    {selectedNode.type}
                  </Badge>
                </p>
                {selectedNode.caseType && (
                  <p>
                    <strong>Case Type:</strong> {selectedNode.caseType}
                  </p>
                )}
                {selectedNode.severity && (
                  <p>
                    <strong>Severity:</strong> {selectedNode.severity}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-slate-500">Click on a node to view details</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Clusters */}
      {clusters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Identified Clusters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {clusters.map((cluster) => (
              <div
                key={cluster.id}
                className="p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition"
                onMouseEnter={() => setHighlightedCluster(cluster)}
                onMouseLeave={() => setHighlightedCluster(null)}
              >
                <p className="font-medium text-sm">{cluster.id}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {cluster.size} entities connected
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}