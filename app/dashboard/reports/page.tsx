'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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
} from 'recharts';
import { Download } from 'lucide-react';

// ---- helper functions ----
function calculateHMPI(sample: any) {
  // Example: average of metal, Si, Ii, Mi
  const metals = [sample.metal, sample.si, sample.ii, sample.mi].map(Number);
  return metals.reduce((a, b) => a + b, 0) / metals.length;
}

function getRiskLevel(hmpi: number) {
  if (hmpi < 1) return { level: 'Low Risk', color: 'green' };
  if (hmpi < 2) return { level: 'Medium Risk', color: 'yellow' };
  if (hmpi < 3) return { level: 'High Risk', color: 'orange' };
  return { level: 'Very High Risk', color: 'red' };
}

export default function ReportsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [samples, setSamples] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
    fetchSamples();
  }, []);

  const fetchProjects = async () => {
    const { data, error } = await supabase.from('projects').select('*');
    if (error) {
      console.error('Error fetching projects:', error.message);
    } else {
      setProjects(data || []);
    }
  };

  const fetchSamples = async () => {
    const { data, error } = await supabase.from('samples').select('*');
    if (error) {
      console.error('Error fetching samples:', error.message);
    } else {
      setSamples(data || []);
    }
    setLoading(false);
  };

  // ---- filter by project ----
  const filteredSamples =
    selectedProject === 'all'
      ? samples
      : samples.filter((s) => s.project_id === selectedProject);

  // ---- compute report data ----
  const reportData = filteredSamples.map((s) => {
    const hmpi = calculateHMPI(s);
    const riskLevel = getRiskLevel(hmpi);
    return { ...s, hmpi, riskLevel };
  });

  const summary = {
    totalSamples: reportData.length,
    averageHMPI:
      reportData.length > 0
        ? reportData.reduce((a, b) => a + b.hmpi, 0) / reportData.length
        : 0,
    highRiskCount: reportData.filter(
      (s) => s.riskLevel.level === 'High Risk' || s.riskLevel.level === 'Very High Risk'
    ).length,
  };

  if (loading) {
    return <p className="p-6">Loading...</p>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Reports</h1>
      <p className="text-gray-600">Access all your project analysis reports</p>

      {/* Project Selector */}
      <div className="flex items-center gap-4">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={fetchSamples}>Analyse</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Samples</CardTitle>
            <CardDescription>{summary.totalSamples}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average HMPI</CardTitle>
            <CardDescription>{summary.averageHMPI.toFixed(2)}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>High Risk Samples</CardTitle>
            <CardDescription>{summary.highRiskCount}</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Separator />

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* HMPI Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>HMPI per Sample</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sample_id" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hmpi" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Level Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    {
                      name: 'Low',
                      value: reportData.filter((s) => s.riskLevel.level === 'Low Risk').length,
                    },
                    {
                      name: 'Medium',
                      value: reportData.filter((s) => s.riskLevel.level === 'Medium Risk').length,
                    },
                    {
                      name: 'High',
                      value: reportData.filter((s) => s.riskLevel.level === 'High Risk').length,
                    },
                    {
                      name: 'Very High',
                      value: reportData.filter((s) => s.riskLevel.level === 'Very High Risk').length,
                    },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label
                >
                  <Cell fill="#22c55e" /> {/* Low */}
                  <Cell fill="#eab308" /> {/* Medium */}
                  <Cell fill="#f97316" /> {/* High */}
                  <Cell fill="#ef4444" /> {/* Very High */}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <Button className="mt-6" variant="outline">
        <Download className="mr-2 h-4 w-4" /> Export Report
      </Button>
    </div>
  );
}



