'use client';
import { useState, useEffect } from 'react';
import { fetchProjects, fetchSamples, calculateHMPI, getRiskLevel } from '@/utils/supabase-helpers';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Download, Loader2, AlertTriangle, FileText } from 'lucide-react';

export default function ReportsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [projectsData, samplesData] = await Promise.all([
        fetchProjects(),
        fetchSamples()
      ]);
      
      setProjects(projectsData);
      setSamples(samplesData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    // Simulate analysis time
    await new Promise(resolve => setTimeout(resolve, 1000));
    setAnalyzing(false);
  };

  // Filter samples by project
  const filteredSamples = selectedProject === 'all' 
    ? samples 
    : samples.filter((s) => s.project_id === selectedProject);

  // Compute report data
  const reportData = filteredSamples.map((s) => {
    const hmpi = calculateHMPI(s.si || 0, s.ii || 1, s.mi || 1);
    const riskLevel = getRiskLevel(hmpi);
    return { ...s, hmpi, riskLevel };
  });

  const summary = {
    totalSamples: reportData.length,
    averageHMPI: reportData.length > 0
      ? reportData.reduce((a, b) => a + b.hmpi, 0) / reportData.length
      : 0,
    highRiskCount: reportData.filter(
      (s) => s.riskLevel.level === 'High Risk' || s.riskLevel.level === 'Very High Risk'
    ).length,
  };

  // Chart data for HMPI per sample
  const hmpiChartData = reportData.slice(0, 10).map(sample => ({
    sample_id: sample.sample_id,
    hmpi: sample.hmpi,
    metal: sample.metal
  }));

  // Risk level distribution for pie chart
  const riskDistribution = reportData.reduce((acc, sample) => {
    const level = sample.riskLevel.level;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const riskChartData = Object.entries(riskDistribution).map(([level, count]) => ({
    name: level,
    value: count,
    color: reportData.find(s => s.riskLevel.level === level)?.riskLevel.color || '#666'
  }));

  // Metal distribution
  const metalDistribution = reportData.reduce((acc, sample) => {
    const metal = sample.metal || 'Unknown';
    acc[metal] = (acc[metal] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const metalChartData = Object.entries(metalDistribution).map(([metal, count]) => ({
    metal,
    count,
    avgHMPI: reportData
      .filter(s => s.metal === metal)
      .reduce((sum, s) => sum + s.hmpi, 0) / count
  }));

  // Time series data (by month)
  const timeSeriesData = reportData
    .sort((a, b) => new Date(a.date || a.created_at).getTime() - new Date(b.date || b.created_at).getTime())
    .reduce((acc, sample) => {
      const date = new Date(sample.date || sample.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const existing = acc.find(item => item.month === monthKey);
      if (existing) {
        existing.avgHMPI = (existing.avgHMPI * existing.count + sample.hmpi) / (existing.count + 1);
        existing.count += 1;
      } else {
        acc.push({
          month: monthKey,
          avgHMPI: sample.hmpi,
          count: 1
        });
      }
      
      return acc;
    }, [] as Array<{ month: string; avgHMPI: number; count: number }>);

  const exportReport = () => {
    const csvContent = [
      ['Sample ID', 'Project ID', 'Metal', 'Si (mg/L)', 'Ii', 'Mi', 'HMPI', 'Risk Level', 'District', 'City', 'Date'].join(','),
      ...reportData.map(sample => [
        sample.sample_id,
        sample.project_id,
        sample.metal || '',
        sample.si || 0,
        sample.ii || 1,
        sample.mi || 1,
        sample.hmpi.toFixed(2),
        sample.riskLevel.level,
        sample.district || '',
        sample.city || '',
        sample.date || sample.created_at?.split('T')[0] || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `water_quality_report_${selectedProject}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Comprehensive water quality analysis and reporting</p>
        </div>
        
        <Button onClick={exportReport} disabled={reportData.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Project Selector and Analysis */}
      <div className="flex items-center gap-4">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.project_id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Analyze
            </>
          )}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Samples</CardTitle>
            <CardDescription>Samples analyzed in this report</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{summary.totalSamples}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Average HMPI</CardTitle>
            <CardDescription>Mean pollution index across samples</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{summary.averageHMPI.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">High Risk Samples</CardTitle>
            <CardDescription>Samples requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{summary.highRiskCount}</div>
            <p className="text-sm text-gray-500 mt-1">
              {summary.totalSamples > 0 ? ((summary.highRiskCount / summary.totalSamples) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HMPI Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>HMPI per Sample</CardTitle>
            <CardDescription>Heavy Metal Pollution Index for individual samples</CardDescription>
          </CardHeader>
          <CardContent>
            {hmpiChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hmpiChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sample_id" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [value.toFixed(2), 'HMPI']}
                    labelFormatter={(label) => `Sample: ${label}`}
                  />
                  <Bar dataKey="hmpi" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No sample data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Level Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Level Distribution</CardTitle>
            <CardDescription>Classification of samples by risk level</CardDescription>
          </CardHeader>
          <CardContent>
            {riskChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={riskChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {riskChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No risk data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metal Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Metal Type Analysis</CardTitle>
            <CardDescription>Distribution of samples by metal type</CardDescription>
          </CardHeader>
          <CardContent>
            {metalChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metalChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metal" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10B981" name="Sample Count" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No metal data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time Series */}
        <Card>
          <CardHeader>
            <CardTitle>HMPI Trend Over Time</CardTitle>
            <CardDescription>Average HMPI progression by month</CardDescription>
          </CardHeader>
          <CardContent>
            {timeSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [value.toFixed(2), 'Avg HMPI']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgHMPI" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No time series data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analysis</CardTitle>
          <CardDescription>Key findings and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Key Findings</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span>
                    {summary.totalSamples} samples analyzed across {
                      selectedProject === 'all' ? projects.length : 1
                    } project{selectedProject === 'all' && projects.length > 1 ? 's' : ''}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span>Average HMPI of {summary.averageHMPI.toFixed(2)} indicates {
                    summary.averageHMPI < 25 ? 'low to moderate' : 
                    summary.averageHMPI < 50 ? 'moderate' : 'high'
                  } pollution levels</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full mt-2 ${summary.highRiskCount > 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <span>
                    {summary.highRiskCount > 0 
                      ? `${summary.highRiskCount} samples require immediate attention`
                      : 'No high-risk samples detected'
                    }
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <span>
                    {Object.keys(metalDistribution).length} different metal types analyzed
                  </span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Recommendations</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <span>
                    {summary.highRiskCount > 0 
                      ? 'Implement immediate remediation measures for high-risk samples'
                      : 'Continue regular monitoring to maintain current quality levels'
                    }
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span>Increase sampling frequency in areas with elevated HMPI values</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span>Review and update treatment protocols based on metal distribution</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <span>Establish trend monitoring for early detection of quality changes</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}