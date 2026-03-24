import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Zap, Cpu, ArrowRight, Activity, Timer, Gauge } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function RoutingInterface() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/route`, { prompt });
      const analysisResponse = await axios.post(`${API}/analyze`, { prompt });
      
      setResult(response.data);
      setAnalysis(analysisResponse.data);
      toast.success('Prompt analyzed successfully');
    } catch (error) {
      console.error('Error analyzing prompt:', error);
      toast.error('Failed to analyze prompt');
    } finally {
      setLoading(false);
    }
  };

  const getModelColor = (model) => {
    return model === 'fast' ? 'text-primary' : 'text-secondary';
  };

  const getModelBadgeClass = (model) => {
    return model === 'fast' 
      ? 'bg-primary/20 text-primary border-primary/50'
      : 'bg-secondary/20 text-secondary border-secondary/50';
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight" style={{fontFamily: 'Azeret Mono, monospace'}}>
          PROMPT ROUTING
        </h1>
        <p className="text-lg text-muted-foreground">
          Real-time complexity analysis and intelligent model routing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <Card className="bg-[#0A0A0A] border-[#1F1F1F] feature-card">
            <CardHeader>
              <CardTitle style={{fontFamily: 'Azeret Mono, monospace'}}>Input Prompt</CardTitle>
              <CardDescription>Enter a prompt to analyze its complexity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                data-testid="prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Explain why gradient descent can get stuck in local minima..."
                className="min-h-[200px] bg-black border-border focus:border-primary focus:ring-1 focus:ring-primary text-white placeholder:text-gray-600 mono"
                style={{fontFamily: 'JetBrains Mono, monospace'}}
              />
              <Button
                data-testid="analyze-button"
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full bg-primary text-black hover:bg-primary/90 font-medium glow-primary"
              >
                {loading ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Analyze & Route
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card className="bg-[#0A0A0A] border-[#1F1F1F]">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest" style={{fontFamily: 'Azeret Mono, monospace'}}>
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-black/50 rounded-md border border-border">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm">Fast Model</span>
                </div>
                <span className="text-xs mono text-muted-foreground">GPT-5-mini</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-black/50 rounded-md border border-border">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-secondary" />
                  <span className="text-sm">Capable Model</span>
                </div>
                <span className="text-xs mono text-muted-foreground">GPT-5.1</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-black/50 rounded-md border border-border">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-accent" />
                  <span className="text-sm">Routing Latency</span>
                </div>
                <span className="text-xs mono text-muted-foreground">&lt; 15ms</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {result && (
        <div className="mt-6 slide-up">
          <Card className="bg-[#0A0A0A] border-[#1F1F1F] glow-primary">
            <CardHeader>
              <CardTitle style={{fontFamily: 'Azeret Mono, monospace'}}>Routing Decision</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-black/50 rounded-lg border border-border">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Routed To</div>
                  <div className="flex items-center gap-2">
                    {result.routed_model === 'fast' ? (
                      <Zap className="w-5 h-5 text-primary" />
                    ) : (
                      <Cpu className="w-5 h-5 text-secondary" />
                    )}
                    <Badge className={getModelBadgeClass(result.routed_model)}>
                      {result.routed_model.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="p-4 bg-black/50 rounded-lg border border-border">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Complexity</div>
                  <div className={`text-2xl font-bold mono ${getModelColor(result.routed_model)}`}>
                    {(result.p_complex * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="p-4 bg-black/50 rounded-lg border border-border">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Confidence</div>
                  <div className="text-2xl font-bold mono text-accent">
                    {(result.confidence * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="p-4 bg-black/50 rounded-lg border border-border">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Latency</div>
                  <div className="text-2xl font-bold mono text-blue-400">
                    {result.latency_ms.toFixed(2)}ms
                  </div>
                </div>
              </div>

              {analysis && (
                <div className="mt-6">
                  <h4 className="text-sm uppercase tracking-widest mb-4 text-muted-foreground" style={{fontFamily: 'Azeret Mono, monospace'}}>
                    Feature Analysis
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Object.entries(analysis.features).map(([key, value]) => (
                      <div key={key} className="p-3 bg-black/30 rounded border border-border/50">
                        <div className="text-xs text-muted-foreground mb-1 capitalize">
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className="text-sm mono font-medium">
                          {typeof value === 'number' ? value.toFixed(3) : value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default RoutingInterface;
