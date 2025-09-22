'use client';
import { useState } from 'react';
import { insertSample, insertSamples } from '@/utils/supabase-helpers';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, PlusCircle, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface SampleData {
  project_id: string;
  sample_id: string;
  metal: string;
  si: string;
  ii: string;
  mi: string;
  latitude: string;
  longitude: string;
  district: string;
  city: string;
  date: string;
}

export default function DataEntryPage() {
  const [uploadedData, setUploadedData] = useState<SampleData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualData, setManualData] = useState<SampleData>({
    project_id: '',
    sample_id: '',
    metal: '',
    si: '',
    ii: '',
    mi: '',
    latitude: '',
    longitude: '',
    district: '',
    city: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);

  // CSV Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setUploadSuccess(false);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim());

        if (lines.length < 2) {
          throw new Error('CSV file must contain at least a header row and one data row');
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const rows: any[] = [];

        // Validate required headers
        const requiredHeaders = ['project_id', 'sample_id'];
        const missingHeaders = requiredHeaders.filter(header => 
          !headers.some(h => h.includes(header.toLowerCase()))
        );

        if (missingHeaders.length > 0) {
          throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
        }

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const obj: any = {};

          headers.forEach((header, idx) => {
            const value = values[idx] || '';
            
            // Map common header variations
            if (header.includes('project') && header.includes('id')) {
              obj.project_id = value;
            } else if (header.includes('sample') && header.includes('id')) {
              obj.sample_id = value;
            } else if (header === 'metal') {
              obj.metal = value;
            } else if (header === 'si') {
              obj.si = parseFloat(value) || 0;
            } else if (header === 'ii') {
              obj.ii = parseFloat(value) || 1;
            } else if (header === 'mi') {
              obj.mi = parseFloat(value) || 1;
            } else if (header === 'latitude' || header === 'lat') {
              obj.latitude = value;
            } else if (header === 'longitude' || header === 'lng' || header === 'lon') {
              obj.longitude = value;
            } else if (header === 'district') {
              obj.district = value;
            } else if (header === 'city') {
              obj.city = value;
            } else if (header === 'date') {
              obj.date = value || new Date().toISOString().split('T')[0];
            }
          });

          // Validate required fields
          if (!obj.project_id || !obj.sample_id) {
            throw new Error(`Row ${i + 1}: Missing required project_id or sample_id`);
          }

          rows.push(obj);
        }

        setUploadedData(rows);

        // Insert into Supabase
        await insertSamples(rows);
        
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 5000);
        
        // Clear file input
        if (e.target) {
          e.target.value = '';
        }
        
      } catch (err: any) {
        console.error('CSV upload error:', err);
        setError(err.message || 'Failed to process CSV file. Please check the format and try again.');
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsText(file);
  };

  // Manual Entry Handler
  const handleManualSave = async () => {
    if (!manualData.project_id || !manualData.sample_id) {
      setError('Project ID and Sample ID are required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const sampleToInsert = {
        ...manualData,
        si: parseFloat(manualData.si) || 0,
        ii: parseFloat(manualData.ii) || 1,
        mi: parseFloat(manualData.mi) || 1,
      };

      await insertSample(sampleToInsert);
      
      // Reset form
      setManualData({
        project_id: '',
        sample_id: '',
        metal: '',
        si: '',
        ii: '',
        mi: '',
        latitude: '',
        longitude: '',
        district: '',
        city: '',
        date: new Date().toISOString().split('T')[0],
      });

      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
      
    } catch (err: any) {
      console.error('Manual save error:', err);
      setError(err.message || 'Failed to save sample. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = [
      'project_id,sample_id,metal,si,ii,mi,latitude,longitude,district,city,date',
      'p1,GNG-008,Lead,0.09,0.3,0.7,25.3176,82.9739,Varanasi,Uttar Pradesh,2025-01-20',
      'p2,YMN-006,Arsenic,0.05,0.2,0.5,28.7041,77.1025,New Delhi,Delhi,2025-02-12'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Data Entry</h1>
        <p className="text-gray-600">Add water quality sample data manually or via CSV upload</p>
      </div>

      {/* Success/Error Messages */}
      {uploadSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Data saved successfully! You can view it in the dashboard.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CSV Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              Bulk Data Upload
            </CardTitle>
            <CardDescription>Upload multiple samples using CSV format</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`text-center border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
                isUploading ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => !isUploading && document.getElementById('file-upload')?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isUploading) {
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                    handleFileUpload(fakeEvent);
                  }
                }
              }}
            >
              {isUploading ? (
                <Loader2 className="h-8 w-8 text-blue-500 mx-auto mb-2 animate-spin" />
              ) : (
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              )}
              <p className="text-sm text-gray-600 mb-4">
                {isUploading ? 'Processing CSV file...' : 'Click to upload or drag and drop your CSV file'}
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={isUploading}
              />
              <Button variant="outline" disabled={isUploading}>
                {isUploading ? 'Processing...' : 'Choose File'}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadTemplate} className="flex-1">
                Download Template
              </Button>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Required columns:</strong> project_id, sample_id<br/>
                <strong>Optional columns:</strong> metal, si, ii, mi, latitude, longitude, district, city, date
              </AlertDescription>
            </Alert>

            {uploadedData.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800 font-medium">
                  Successfully processed {uploadedData.length} samples
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Entry */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-blue-600" />
              Manual Entry
            </CardTitle>
            <CardDescription>Enter sample details manually</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_id">Project ID *</Label>
                <Input
                  id="project_id"
                  placeholder="e.g., p1"
                  value={manualData.project_id}
                  onChange={(e) => setManualData({ ...manualData, project_id: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sample_id">Sample ID *</Label>
                <Input
                  id="sample_id"
                  placeholder="e.g., GNG-001"
                  value={manualData.sample_id}
                  onChange={(e) => setManualData({ ...manualData, sample_id: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metal">Metal Type</Label>
              <Input
                id="metal"
                placeholder="e.g., Lead, Arsenic, Mercury"
                value={manualData.metal}
                onChange={(e) => setManualData({ ...manualData, metal: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="si">Si (mg/L)</Label>
                <Input
                  id="si"
                  type="number"
                  step="0.001"
                  placeholder="0.000"
                  value={manualData.si}
                  onChange={(e) => setManualData({ ...manualData, si: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ii">Ii</Label>
                <Input
                  id="ii"
                  type="number"
                  step="0.001"
                  placeholder="1.000"
                  value={manualData.ii}
                  onChange={(e) => setManualData({ ...manualData, ii: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mi">Mi</Label>
                <Input
                  id="mi"
                  type="number"
                  step="0.001"
                  placeholder="1.000"
                  value={manualData.mi}
                  onChange={(e) => setManualData({ ...manualData, mi: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  placeholder="e.g., 25.3176"
                  value={manualData.latitude}
                  onChange={(e) => setManualData({ ...manualData, latitude: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  placeholder="e.g., 82.9739"
                  value={manualData.longitude}
                  onChange={(e) => setManualData({ ...manualData, longitude: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  placeholder="e.g., Varanasi"
                  value={manualData.district}
                  onChange={(e) => setManualData({ ...manualData, district: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City/State</Label>
                <Input
                  id="city"
                  placeholder="e.g., Uttar Pradesh"
                  value={manualData.city}
                  onChange={(e) => setManualData({ ...manualData, city: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Collection Date</Label>
              <Input
                id="date"
                type="date"
                value={manualData.date}
                onChange={(e) => setManualData({ ...manualData, date: e.target.value })}
              />
            </div>

            <Button 
              onClick={handleManualSave} 
              className="w-full"
              disabled={saving || !manualData.project_id || !manualData.sample_id}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Save Sample
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Data Entry Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">CSV Upload Format</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use comma-separated values (.csv format)</li>
                <li>• Include headers in the first row</li>
                <li>• Required: project_id, sample_id</li>
                <li>• Numeric values: si, ii, mi (use decimal notation)</li>
                <li>• Date format: YYYY-MM-DD</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Manual Entry Tips</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Project ID must match existing project</li>
                <li>• Sample ID should be unique</li>
                <li>• Si = Metal concentration in mg/L</li>
                <li>• Ii = Permissible limit value</li>
                <li>• Mi = Relative weight of metal</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}