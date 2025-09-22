import { supabase } from '@/lib/supabase';

// Helper functions for HMPI calculations
export function calculateHMPI(si: number, ii: number, mi: number): number {
  const hmpi = (si / ii) * mi * 100;
  return Math.round(hmpi * 100) / 100; // Round to 2 decimal places
}

export function getRiskLevel(hmpi: number): { level: string; color: string } {
  if (hmpi >= 100) return { level: "Very High Risk", color: "#DC2626" };
  if (hmpi >= 50) return { level: "High Risk", color: "#EA580C" };
  if (hmpi >= 25) return { level: "Moderate Risk", color: "#D97706" };
  if (hmpi >= 10) return { level: "Low Risk", color: "#65A30D" };
  return { level: "Safe", color: "#059669" };
}

// Database query helpers
export async function fetchProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
  
  return data || [];
}

export async function fetchSamples() {
  const { data, error } = await supabase
    .from('samples')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching samples:', error);
    throw error;
  }
  
  return data || [];
}

export async function fetchAlerts() {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching alerts:', error);
    throw error;
  }
  
  return data || [];
}

export async function fetchPolicies() {
  const { data, error } = await supabase
    .from('policies')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching policies:', error);
    throw error;
  }
  
  return data || [];
}

export async function insertProject(project: {
  project_id: string;
  name: string;
  description: string;
  district: string;
  city: string;
  latitude?: string;
  longitude?: string;
}) {
  const { data, error } = await supabase
    .from('projects')
    .insert([project])
    .select();
  
  if (error) {
    console.error('Error inserting project:', error);
    throw error;
  }
  
  return data?.[0];
}

export async function insertSample(sample: {
  project_id: string;
  sample_id: string;
  metal?: string;
  si?: number;
  ii?: number;
  mi?: number;
  latitude?: string;
  longitude?: string;
  district?: string;
  city?: string;
  date?: string;
}) {
  const { data, error } = await supabase
    .from('samples')
    .insert([sample])
    .select();
  
  if (error) {
    console.error('Error inserting sample:', error);
    throw error;
  }
  
  return data?.[0];
}

export async function insertSamples(samples: any[]) {
  const { data, error } = await supabase
    .from('samples')
    .insert(samples)
    .select();
  
  if (error) {
    console.error('Error inserting samples:', error);
    throw error;
  }
  
  return data || [];
}

export async function updateAlert(id: string, updates: { acknowledged?: boolean }) {
  const { data, error } = await supabase
    .from('alerts')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) {
    console.error('Error updating alert:', error);
    throw error;
  }
  
  return data?.[0];
}

export async function insertPolicy(policy: {
  name: string;
  metal: string;
  threshold: number;
  created_by?: string;
}) {
  const { data, error } = await supabase
    .from('policies')
    .insert([policy])
    .select();
  
  if (error) {
    console.error('Error inserting policy:', error);
    throw error;
  }
  
  return data?.[0];
}

// Standards for comparison
export const standards = {
  WHO: {
    Lead: 0.01,
    Arsenic: 0.01,
    Chromium: 0.05,
    Mercury: 0.006,
    Cadmium: 0.003,
  },
  BBI: {
    Lead: 0.05,
    Arsenic: 0.05,
    Chromium: 0.1,
    Mercury: 0.001,
    Cadmium: 0.005,
  },
};