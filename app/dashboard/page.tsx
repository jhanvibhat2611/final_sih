'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchProjects, fetchSamples, fetchAlerts, calculateHMPI, getRiskLevel } from '@/utils/supabase-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  FolderOpen,
  TestTube,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Activity,
  Loader2
} from 'lucide-react';

interface DashboardData {
  projects: any[];
  samples: any[];
  alerts: any[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({ projects: [], samples: [], alerts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [projects, samples, alerts] = await Promise.all([
        fetchProjects(),
        fetchSamples(),
        fetchAlerts()
      ]);
      
      setData({ projects, samples, alerts });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
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

  // Calculate statistics
  const totalProjects = data.projects.length;
  const totalSamples = data.samples.length;
  const totalAlerts = data.alerts.filter(a => !a.acknowledged).length;
  
  // Calculate HMPI for all samples
  const samplesWithHMPI = data.samples.map(sample => ({
    ...sample,
    hmpi: calculateHMPI(sample.si || 0, sample.ii || 1, sample.mi || 1),
    riskLevel: getRiskLevel(calculateHMPI(sample.si || 0, sample.ii || 1, sample.mi || 1))
  }));

  const averageHMPI = samplesWithHMPI.length > 0 
    ? samplesWithHMPI.reduce((sum, s) => sum + s.hmpi, 0) / samplesWithHMPI.length 
    : 0;

  // Risk distribution
  const riskDistribution = samplesWithHMPI.reduce((acc, sample) => {
    const level = sample.riskLevel.level;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const riskChartData = Object.entries(riskDistribution).map(([level, count]) => ({
    name: level,
    value: count,
    color: samplesWithHMPI.find(s => s.riskLevel.level === level)?.riskLevel.color || '#666'
  }));

  // Project-wise sample distribution
  const projectDistribution = data.projects.map(project => ({
    name: project.name.length > 20 ? project.name.substring(0, 20) + '...' : project.name,
    samples: data.samples.filter(s => s.project_id === project.project_id).length,
    alerts: data.alerts.filter(a => a.project_id === project.project_id && !a.acknowledged).length
  }));

  // Recent activities
  const recentActivities = [
    ...data.samples.slice(0, 2).map(sample => ({
      id: sample.id,
      action: 'New sample added',
      project: data.projects.find(p => p.project_id === sample.project_id)?.name || 'Unknown Project',
      time: new Date(sample.created_at).toLocaleDateString()
    })),
    ...data.alerts.slice(0, 2).map(alert => ({
      id: alert.id,
      action: 'Alert generated',
      project: data.projects.find(p => p.project_id === alert.project_id)?.name || 'Unknown Project',
      time: new Date(alert.created_at).toLocaleDateString()
    }))
  ].slice(0, 4);

  const getRoleSpecificContent = () => {
    switch (user?.role) {
      case 'scientist':
        return {
          title: 'Scientific Analysis Dashboard',
          description: 'Monitor water quality data and conduct environmental analysis',
          primaryActions: ['Add New Sample', 'Run Calculations', 'Generate Report']
        };
      case 'policy-maker':
        return {
          title: 'Policy Management Dashboard',
          description: 'Review environmental data and manage policy thresholds',
          primaryActions: ['Review Alerts', 'Update Thresholds', 'View Reports']
        };
      case 'researcher':
        return {
          title: 'Research Analysis Dashboard',
          description: 'Explore environmental data and research insights',
          primaryActions: ['View Visualization', 'Access Reports', 'Analyze Trends']
        };
      default:
        return {
          title: 'Dashboard',
          description: 'Water quality monitoring overview',
          primaryActions: []
        };
    }
  };

  const roleContent = getRoleSpecificContent();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">{roleContent.title}</h1>
        <p className="text-gray-600">{roleContent.description}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">Active monitoring projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Water Samples</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSamples}</div>
            <p className="text-xs text-muted-foreground">Collected and analyzed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalAlerts}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg HMPI</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageHMPI.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Pollution index level</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Project Sample Distribution</CardTitle>
            <CardDescription>Number of samples per project location</CardDescription>
          </CardHeader>
          <CardContent>
            {projectDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="samples" fill="#3B82F6" name="Samples" />
                  <Bar dataKey="alerts" fill="#EF4444" name="Alerts" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">
                No project data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Level Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Level Distribution</CardTitle>
            <CardDescription>Sample classification by pollution risk</CardDescription>
          </CardHeader>
          <CardContent>
            {riskChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={riskChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {riskChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">
                No risk data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>Latest water quality monitoring projects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.projects.slice(0, 4).map((project) => {
              const projectSamples = data.samples.filter(s => s.project_id === project.project_id);
              const projectAlerts = data.alerts.filter(a => a.project_id === project.project_id && !a.acknowledged);
              const avgHMPI = projectSamples.length > 0 
                ? projectSamples.reduce((sum, s) => sum + calculateHMPI(s.si || 0, s.ii || 1, s.mi || 1), 0) / projectSamples.length 
                : 0;

              return (
                <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{project.name}</h4>
                    <p className="text-sm text-gray-500">{project.district}, {project.city}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {projectSamples.length} samples
                      </Badge>
                      {projectAlerts.length > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {projectAlerts.length} alerts
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">HMPI: {avgHMPI.toFixed(1)}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(project.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest system activities and updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.project}</p>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for your role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {roleContent.primaryActions.map((action) => (
              <Badge key={action} variant="outline" className="cursor-pointer hover:bg-blue-50">
                {action}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}