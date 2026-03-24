import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, DollarSign, Activity, Zap, Cpu, Target } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AnalyticsDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center h-64">
          <Activity className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!stats || stats.total_requests === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight" style={{fontFamily: 'Azeret Mono, monospace'}}>
          ANALYTICS
        </h1>
        <Card className="bg-[#0A0A0A] border-[#1F1F1F]">
          <CardContent className="py-12 text-center">
            <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No routing data yet. Start by analyzing prompts.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pieData = [
    { name: 'Fast Model', value: stats.routed_to_fast, color: '#10B981' },
    { name: 'Capable Model', value: stats.routed_to_capable, color: '#8B5CF6' }
  ];

  const barData = [
    { name: 'Fast', count: stats.routed_to_fast, color: '#10B981' },
    { name: 'Capable', count: stats.routed_to_capable, color: '#8B5CF6' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight" style={{fontFamily: 'Azeret Mono, monospace'}}>
          ANALYTICS DASHBOARD
        </h1>
        <p className="text-lg text-muted-foreground">
          Routing performance and cost optimization metrics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-[#0A0A0A] border-[#1F1F1F] feature-card" data-testid="total-requests-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground uppercase tracking-widest">Total Requests</div>
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold mono">{stats.total_requests}</div>
          </CardContent>
        </Card>

        <Card className="bg-[#0A0A0A] border-[#1F1F1F] feature-card" data-testid="fast-routing-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground uppercase tracking-widest">Fast Routing</div>
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold mono text-primary">{stats.fast_percentage.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card className="bg-[#0A0A0A] border-[#1F1F1F] feature-card" data-testid="cost-savings-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground uppercase tracking-widest">Cost Savings</div>
              <DollarSign className="w-5 h-5 text-accent" />
            </div>
            <div className="text-3xl font-bold mono text-accent">{stats.estimated_cost_savings_percent.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card className="bg-[#0A0A0A] border-[#1F1F1F] feature-card" data-testid="avg-confidence-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground uppercase tracking-widest">Avg Confidence</div>
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold mono text-blue-400">{(stats.avg_confidence * 100).toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="bg-[#0A0A0A] border-[#1F1F1F]" data-testid="distribution-chart">
          <CardHeader>
            <CardTitle style={{fontFamily: 'Azeret Mono, monospace'}}>Routing Distribution</CardTitle>
            <CardDescription>Model selection breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A0A0A',
                    border: '1px solid #1F1F1F',
                    borderRadius: '8px',
                    fontFamily: 'JetBrains Mono, monospace'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#0A0A0A] border-[#1F1F1F]" data-testid="comparison-chart">
          <CardHeader>
            <CardTitle style={{fontFamily: 'Azeret Mono, monospace'}}>Model Usage Comparison</CardTitle>
            <CardDescription>Request count by model type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <XAxis
                  dataKey="name"
                  stroke="#A1A1AA"
                  style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}
                />
                <YAxis
                  stroke="#A1A1AA"
                  style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A0A0A',
                    border: '1px solid #1F1F1F',
                    borderRadius: '8px',
                    fontFamily: 'JetBrains Mono, monospace'
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#0A0A0A] border-[#1F1F1F]">
        <CardHeader>
          <CardTitle style={{fontFamily: 'Azeret Mono, monospace'}}>Performance Metrics</CardTitle>
          <CardDescription>Detailed routing statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-black/50 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Fast Model Requests</span>
              </div>
              <div className="text-2xl font-bold mono text-primary">{stats.routed_to_fast}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats.fast_percentage.toFixed(1)}% of total
              </div>
            </div>

            <div className="p-4 bg-black/50 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-4 h-4 text-secondary" />
                <span className="text-sm font-medium">Capable Model Requests</span>
              </div>
              <div className="text-2xl font-bold mono text-secondary">{stats.routed_to_capable}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats.capable_percentage.toFixed(1)}% of total
              </div>
            </div>

            <div className="p-4 bg-black/50 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium">Average Latency</span>
              </div>
              <div className="text-2xl font-bold mono text-accent">{stats.avg_latency_ms.toFixed(2)}ms</div>
              <div className="text-xs text-muted-foreground mt-1">
                Routing overhead per request
              </div>
            </div>

            <div className="p-4 bg-black/50 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium">Average Confidence</span>
              </div>
              <div className="text-2xl font-bold mono text-blue-400">{(stats.avg_confidence * 100).toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                Model routing certainty
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AnalyticsDashboard;
