import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function CaseNetworkGraph({ caseId }) {
  const canvasRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [forceRunning, setForceRunning] = useState(true);
  const animationRef = useRef(null);
  const nodesRef = useRef([]);
  const edgesRef = useRef([]);

  const { data: networkData, isLoading, error } = useQuery({
    queryKey: ['case-network', caseId],
    queryFn: async () => {
      const result = await base44.functions.invoke('buildCaseNetworkGraph', { case_id: caseId });
      return result.data;
    },
    staleTime: 60000,
  });

  // Initialize force-directed simulation
  useEffect(() => {
    if (!networkData) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    // Initialize nodes with random positions
    nodesRef.current = networkData.network.nodes.map((node, i) => ({
      ...node,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0,
    }));

    edgesRef.current = networkData.network.edges;

    // Force simulation parameters
    const config = {
      chargeForce: -300,
      linkDistance: 100,
      friction: 0.95,
      timeStep: 0.016,
    };

    const simulate = () => {
      const nodes = nodesRef.current;
      const edges = edgesRef.current;

      // Reset forces
      nodes.forEach(node => {
        node.fx = 0;
        node.fy = 0;
      });

      // Apply repulsive forces (charge)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (config.chargeForce * 100) / (dist * dist);

          nodes[i].fx -= (force * dx) / dist;
          nodes[i].fy -= (force * dy) / dist;
          nodes[j].fx += (force * dx) / dist;
          nodes[j].fy += (force * dy) / dist;
        }
      }

      // Apply attractive forces (springs)
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);

        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - config.linkDistance) * 0.1;

          source.fx += (force * dx) / dist;
          source.fy += (force * dy) / dist;
          target.fx -= (force * dx) / dist;
          target.fy -= (force * dy) / dist;
        }
      });

      // Update velocities and positions
      nodes.forEach(node => {
        node.vx += node.fx;
        node.vy += node.fy;
        node.vx *= config.friction;
        node.vy *= config.friction;
        node.x += node.vx * config.timeStep;
        node.y += node.vy * config.timeStep;

        // Boundary collision
        if (node.x < 0) node.x = 0;
        if (node.x > width) node.x = width;
        if (node.y < 0) node.y = 0;
        if (node.y > height) node.y = height;
      });
    };

    const render = () => {
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = 1;

      // Draw edges
      edgesRef.current.forEach(edge => {
        const source = nodesRef.current.find(n => n.id === edge.source);
        const target = nodesRef.current.find(n => n.id === edge.target);

        if (source && target) {
          ctx.strokeStyle = getEdgeColor(edge.type);
          ctx.lineWidth = edge.strength === 'strong' ? 3 : 1.5;
          ctx.globalAlpha = edge.strength === 'strong' ? 1 : 0.5;
          ctx.beginPath();
          ctx.moveTo(source.x, source.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
        }
      });

      ctx.globalAlpha = 1;

      // Draw nodes
      nodesRef.current.forEach(node => {
        const radius = getNodeSize(node.type);
        const isSelected = selectedNode?.id === node.id;

        ctx.fillStyle = getNodeColor(node.type, node);
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + (isSelected ? 5 : 0), 0, Math.PI * 2);
        ctx.fill();

        if (isSelected) {
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Draw label for important nodes
        if (node.type === 'case' || node.type === 'incident') {
          ctx.fillStyle = '#000';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.label.substring(0, 20), node.x, node.y);
        }
      });
    };

    const animate = () => {
      if (forceRunning) {
        simulate();
      }
      render();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle canvas click
    const handleCanvasClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      let clicked = null;
      for (const node of nodesRef.current) {
        const dist = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
        if (dist < getNodeSize(node.type) + 10) {
          clicked = node;
          break;
        }
      }

      setSelectedNode(clicked);
    };

    canvas.addEventListener('click', handleCanvasClick);

    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
      cancelAnimationFrame(animationRef.current);
    };
  }, [networkData, forceRunning]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center gap-3 h-96">
          <Loader2 className="w-4 h-4 animate-spin" />
          <p>Building network graph...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !networkData) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-6 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <p className="text-red-800">Failed to load network graph</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Case Network Map</CardTitle>
            <Button
              size="sm"
              variant={forceRunning ? 'default' : 'outline'}
              onClick={() => setForceRunning(!forceRunning)}
            >
              {forceRunning ? 'Pause' : 'Resume'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <canvas
            ref={canvasRef}
            className="w-full border rounded-lg bg-white cursor-pointer"
            style={{ height: '500px', display: 'block' }}
          />
          <div className="mt-3 grid grid-cols-5 gap-2 text-xs">
            {[
              { label: 'Case', color: '#3B82F6' },
              { label: 'Incident', color: '#EF4444' },
              { label: 'Evidence', color: '#10B981' },
              { label: 'Party', color: '#F59E0B' },
              { label: 'Communication', color: '#8B5CF6' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Network Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Network Statistics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold text-slate-900">{networkData.network.stats.node_count}</p>
            <p className="text-xs text-slate-600">Total Entities</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{networkData.network.stats.edge_count}</p>
            <p className="text-xs text-slate-600">Relationships</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{networkData.network.stats.incident_count}</p>
            <p className="text-xs text-slate-600">Incidents</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{networkData.network.stats.evidence_count}</p>
            <p className="text-xs text-slate-600">Evidence Items</p>
          </div>
        </CardContent>
      </Card>

      {/* Patterns Detected */}
      {networkData.patterns && networkData.patterns.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600" />
              Patterns Detected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {networkData.patterns.map((pattern, idx) => (
              <div key={idx} className="bg-white p-3 rounded border border-amber-200">
                <p className="font-medium text-sm text-slate-900">{pattern.title}</p>
                <p className="text-xs text-slate-600 mt-1">{pattern.description}</p>
                {pattern.severity && (
                  <Badge className="mt-2" variant={pattern.severity === 'high' ? 'destructive' : 'default'}>
                    {pattern.severity} severity
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Selected Node Details */}
      {selectedNode && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm">Selected: {selectedNode.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div>
              <span className="font-medium">Type:</span> {selectedNode.type}
            </div>
            {selectedNode.severity && (
              <div>
                <span className="font-medium">Severity:</span> {selectedNode.severity}
              </div>
            )}
            {selectedNode.strength && (
              <div>
                <span className="font-medium">Strength:</span> {selectedNode.strength}
              </div>
            )}
            {selectedNode.date && (
              <div>
                <span className="font-medium">Date:</span> {selectedNode.date}
              </div>
            )}
            <Button size="sm" className="mt-2 w-full" variant="outline">
              View Details
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getNodeColor(type, node) {
  const colors = {
    case: '#3B82F6',
    incident: '#EF4444',
    evidence: '#10B981',
    party: '#F59E0B',
    communication: '#8B5CF6',
  };
  return colors[type] || '#6B7280';
}

function getNodeSize(type) {
  const sizes = {
    case: 15,
    incident: 12,
    evidence: 10,
    party: 10,
    communication: 8,
  };
  return sizes[type] || 8;
}

function getEdgeColor(type) {
  const colors = {
    case_incident: '#EF4444',
    incident_evidence: '#10B981',
    party_communication: '#8B5CF6',
    communication_incident: '#F59E0B',
    incident_party: '#3B82F6',
  };
  return colors[type] || '#D1D5DB';
}