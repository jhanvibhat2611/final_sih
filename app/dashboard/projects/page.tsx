'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { samples, alerts, calculateHMPI, getRiskLevel } from '@/utils/data';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderOpen, Plus, MapPin, Calendar, Eye, BarChart3 } from 'lucide-react';

interface Project {
  id: string;
  project_id: string;
  name: string;
  description: string;
  district: string;
  city: string;
  latitude: string;
  longitude: string;
  created_at: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newProject, setNewProject] = useState({
    project_id: '',
    name: '',
    description: '',
    district: '',
    city: '',
    latitude: '',
    longitude: '',
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // ✅ Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) console.error('Error fetching projects:', error.message);
      else if (data) setProjects(data);
    };
    fetchProjects();
  }, []);

  // ✅ Save new project
  const handleCreateProject = async () => {
    const { data, error } = await supabase.from('projects').insert([newProject]).select();
    if (error) {
      alert('Failed to create project: ' + error.message);
      return;
    }
    if (data) setProjects([data[0], ...projects]);
    setNewProject({
      project_id: '',
      name: '',
      description: '',
      district: '',
      city: '',
      latitude: '',
      longitude: '',
    });
    setIsDialogOpen(false);
  };

  // ✅ Filter
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProjectStats = (projectId: string) => {
    const projectSamples = samples.filter((s) => s.projectId === projectId);
    const projectAlerts = alerts.filter((a) => a.projectId === projectId && !a.acknowledged);
    const avgHMPI =
      projectSamples.length > 0
        ? projectSamples.reduce((sum, s) => sum + calculateHMPI(s), 0) / projectSamples.length
        : 0;
    const riskLevels = projectSamples.map((s) => getRiskLevel(calculateHMPI(s)).level);
    const highRiskCount = riskLevels.filter((level) => level === 'High Risk' || level === 'Very High Risk').length;

    return { sampleCount: projectSamples.length, alertCount: projectAlerts.length, avgHMPI, highRiskCount };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Manage water quality monitoring projects</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>Add a new water quality monitoring project</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="e.g., Krishna River Study - Vijayawada"
                  value={newProject.name}
                  onChange={(e) => setNewProject((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              {/* Project ID */}
              <div className="space-y-2">
                <Label htmlFor="project-id">Project ID</Label>
                <Input
                  id="project-id"
                  placeholder="Unique project identifier"
                  value={newProject.project_id}
                  onChange={(e) => setNewProject((prev) => ({ ...prev, project_id: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  placeholder="Brief description of the project objectives"
                  value={newProject.description}
                  onChange={(e) => setNewProject((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {/* District + City */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  <Input
                    id="district"
                    placeholder="District name"
                    value={newProject.district}
                    onChange={(e) => setNewProject((prev) => ({ ...prev, district: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City/State</Label>
                  <Input
                    id="city"
                    placeholder="City or State"
                    value={newProject.city}
                    onChange={(e) => setNewProject((prev) => ({ ...prev, city: e.target.value }))}
                  />
                </div>
              </div>

              {/* Latitude + Longitude */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    placeholder="e.g., 16.5062"
                    value={newProject.latitude}
                    onChange={(e) => setNewProject((prev) => ({ ...prev, latitude: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    placeholder="e.g., 80.6480"
                    value={newProject.longitude}
                    onChange={(e) => setNewProject((prev) => ({ ...prev, longitude: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleCreateProject}
                  disabled={!newProject.name || !newProject.project_id || !newProject.district || !newProject.city}
                >
                  Create Project
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search projects by name, city, or district..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const stats = getProjectStats(project.id);

          return (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{project.name}</CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {project.district}, {project.city}
                    </CardDescription>
                    <p className="text-xs text-gray-500 mt-1">Project ID: {project.project_id}</p>
                    <p className="text-xs text-gray-500">Lat: {project.latitude}, Lng: {project.longitude}</p>
                  </div>
                  <FolderOpen className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>

                {/* Project Stats */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.sampleCount}</div>
                    <div className="text-xs text-gray-500">Samples</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${stats.alertCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {stats.alertCount}
                    </div>
                    <div className="text-xs text-gray-500">Alerts</div>
                  </div>
                </div>

                {/* HMPI + Risk Info */}
                {stats.sampleCount > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Avg HMPI:</span>
                      <span className="font-medium">{stats.avgHMPI.toFixed(1)}</span>
                    </div>
                    {stats.highRiskCount > 0 && (
                      <Badge variant="destructive" className="w-full justify-center text-xs">
                        {stats.highRiskCount} High Risk Sample{stats.highRiskCount > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Project Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(project.created_at).toLocaleDateString()}
                  </div>
                  <Badge variant="outline" className="text-xs">Active</Badge>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}




