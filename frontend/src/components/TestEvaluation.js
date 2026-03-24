import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Activity, CheckCircle2, XCircle, AlertTriangle, Target, TrendingUp, Zap, Cpu } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function TestEvaluation() {
  const [testPrompts, setTestPrompts] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTestPrompts();
  }, []);

  const fetchTestPrompts = async () => {
    try {
      const response = await axios.get(`${API}/test-prompts`);
      setTestPrompts(response.data.prompts);
    } catch (error) {
      console.error('Error fetching test prompts:', error);
      toast.error('Failed to load test prompts');
    }
  };

  const runEvaluation = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/evaluate`);
      setEvaluation(response.data);
      toast.success('Evaluation completed successfully');
    } catch (error) {
      console.error('Error running evaluation:', error);
      toast.error('Failed to run evaluation');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (correct) => {
    return correct ? (
      <CheckCircle2 className="w-5 h-5 text-primary" />
    ) : (
      <XCircle className="w-5 h-5 text-destructive" />
    );
  };

  const getMetricColor = (value, threshold, inverse = false) => {
    if (inverse) {
      return value <= threshold ? 'text-primary' : 'text-destructive';
    }
    return value >= threshold ? 'text-primary' : 'text-destructive';
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight" style={{fontFamily: 'Azeret Mono, monospace'}}>
          TEST EVALUATION
        </h1>
        <p className="text-lg text-muted-foreground">
          Evaluate routing model on 20 predefined test cases
        </p>
      </div>

      <div className="mb-6">
        <Button
          data-testid="run-evaluation-button"
          onClick={runEvaluation}
          disabled={loading}
          className="bg-primary text-black hover:bg-primary/90 font-medium glow-primary"
        >
          {loading ? (
            <>
              <Activity className="w-4 h-4 mr-2 animate-spin" />
              Running Evaluation...
            </>
          ) : (
            <>
              <Target className="w-4 h-4 mr-2" />
              Run Evaluation
            </>
          )}
        </Button>
      </div>

      {evaluation && (
        <div className="space-y-6 slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-[#0A0A0A] border-[#1F1F1F]" data-testid="accuracy-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-muted-foreground uppercase tracking-widest">Accuracy</div>
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div className={`text-3xl font-bold mono ${getMetricColor(evaluation.accuracy, 80)}`}>
                  {evaluation.accuracy.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {evaluation.correct}/{evaluation.total_prompts} correct
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0A0A0A] border-[#1F1F1F]" data-testid="critical-error-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-muted-foreground uppercase tracking-widest">Critical Errors</div>
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div className={`text-3xl font-bold mono ${getMetricColor(evaluation.critical_error_rate, 10, true)}`}>
                  {evaluation.critical_error_rate.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Complex → Fast routing
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0A0A0A] border-[#1F1F1F]" data-testid="waste-rate-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-muted-foreground uppercase tracking-widest">Waste Rate</div>
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <div className={`text-3xl font-bold mono ${getMetricColor(evaluation.waste_rate, 25, true)}`}>
                  {evaluation.waste_rate.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Simple → Capable routing
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0A0A0A] border-[#1F1F1F]" data-testid="total-tests-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-muted-foreground uppercase tracking-widest">Total Tests</div>
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-3xl font-bold mono text-blue-400">
                  {evaluation.total_prompts}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Test cases evaluated
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#0A0A0A] border-[#1F1F1F]">
            <CardHeader>
              <CardTitle style={{fontFamily: 'Azeret Mono, monospace'}}>Test Results</CardTitle>
              <CardDescription>Detailed breakdown of each test case</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {evaluation.results.map((result) => (
                  <div
                    key={result.test_id}
                    data-testid={`test-result-${result.test_id}`}
                    className={`p-4 rounded-lg border ${
                      result.correct
                        ? 'bg-primary/5 border-primary/30'
                        : 'bg-destructive/5 border-destructive/30'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1">{getStatusIcon(result.correct)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs mono text-muted-foreground">#{result.test_id}</span>
                          <Badge variant="outline" className="text-xs">
                            {result.category}
                          </Badge>
                          <Badge
                            className={
                              result.true_label === 'simple'
                                ? 'bg-primary/20 text-primary border-primary/50'
                                : 'bg-secondary/20 text-secondary border-secondary/50'
                            }
                          >
                            {result.true_label}
                          </Badge>
                        </div>
                        <p className="text-sm mb-2 mono">{result.prompt}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-muted-foreground">Predicted: </span>
                            <span className="font-medium">
                              {result.predicted_model === 'fast' ? (
                                <span className="text-primary flex items-center gap-1">
                                  <Zap className="w-3 h-3" /> Fast
                                </span>
                              ) : (
                                <span className="text-secondary flex items-center gap-1">
                                  <Cpu className="w-3 h-3" /> Capable
                                </span>
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Complexity: </span>
                            <span className="font-medium mono">{(result.p_complex * 100).toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Confidence: </span>
                            <span className="font-medium mono">{(result.confidence * 100).toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Status: </span>
                            <span className={`font-medium ${result.correct ? 'text-primary' : 'text-destructive'}`}>
                              {result.correct ? 'Correct' : 'Incorrect'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0A0A0A] border-[#1F1F1F]">
            <CardHeader>
              <CardTitle style={{fontFamily: 'Azeret Mono, monospace'}}>Evaluation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-black/50 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overall Accuracy</span>
                    <span className="font-bold mono">{evaluation.accuracy.toFixed(1)}%</span>
                  </div>
                  <div className="mt-2 h-2 bg-black rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${evaluation.accuracy}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 bg-black/50 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Critical Error Rate</span>
                    <span className="font-bold mono text-destructive">{evaluation.critical_error_rate.toFixed(1)}%</span>
                  </div>
                  <div className="mt-2 h-2 bg-black rounded-full overflow-hidden">
                    <div
                      className="h-full bg-destructive"
                      style={{ width: `${evaluation.critical_error_rate}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Target: &lt; 10% (routing complex prompts to fast model)
                  </p>
                </div>

                <div className="p-4 bg-black/50 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Waste Rate</span>
                    <span className="font-bold mono text-accent">{evaluation.waste_rate.toFixed(1)}%</span>
                  </div>
                  <div className="mt-2 h-2 bg-black rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${evaluation.waste_rate}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Target: &lt; 25% (routing simple prompts to capable model)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!evaluation && testPrompts.length > 0 && (
        <Card className="bg-[#0A0A0A] border-[#1F1F1F]">
          <CardHeader>
            <CardTitle style={{fontFamily: 'Azeret Mono, monospace'}}>Test Prompts Preview</CardTitle>
            <CardDescription>20 test cases covering simple and complex scenarios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testPrompts.slice(0, 5).map((test) => (
                <div key={test.id} className="p-3 bg-black/30 rounded border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs mono text-muted-foreground">#{test.id}</span>
                    <Badge variant="outline" className="text-xs">{test.category}</Badge>
                    <Badge
                      className={
                        test.label === 'simple'
                          ? 'bg-primary/20 text-primary border-primary/50'
                          : 'bg-secondary/20 text-secondary border-secondary/50'
                      }
                    >
                      {test.label}
                    </Badge>
                  </div>
                  <p className="text-sm mono">{test.prompt}</p>
                </div>
              ))}
              {testPrompts.length > 5 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  ... and {testPrompts.length - 5} more test cases
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default TestEvaluation;
