"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, Download, AlertCircle, PlusCircle } from "lucide-react";

type SampleData = {
  sampleId: string;
  projectId: string;
  district?: string;
  city?: string;
  latitude?: string;
  longitude?: string;
  metal?: string;
  Si?: string;
  Ii?: string;
  Mi?: string;
  date?: string;
};

export default function BulkData() {
  const [uploadedData, setUploadedData] = useState<SampleData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [manualData, setManualData] = useState<SampleData>({
    sampleId: "",
    projectId: "",
    district: "",
    city: "",
    latitude: "",
    longitude: "",
    metal: "",
    Si: "",
    Ii: "",
    Mi: "",
    date: "",
  });

  // === CSV UPLOAD ===
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter(Boolean);

        const headers = lines[0].split(",").map((h) => h.trim());
        const rows: SampleData[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",");
          const obj: any = {};
          headers.forEach((h, idx) => {
            obj[h] = values[idx]?.trim() || "";
          });

          rows.push({
            sampleId: obj.sampleId || obj.SampleID || "",
            projectId: obj.projectId || obj.ProjectID || "",
            district: obj.district || obj.District || "",
            city: obj.city || obj.City || "",
            latitude: obj.latitude || obj.Latitude || "",
            longitude: obj.longitude || obj.Longitude || "",
            metal: obj.metal || obj.Metal || "",
            Si: obj.Si || "",
            Ii: obj.Ii || "",
            Mi: obj.Mi || "",
            date: obj.date || obj.Date || new Date().toISOString().split("T")[0],
          });
        }

        setUploadedData(rows);

        const { error } = await supabase.from("samples").insert(rows);
        if (error) throw error;

        alert("CSV uploaded successfully ✅");
      } catch (err) {
        console.error(err);
        alert("Upload failed. Please check CSV format.");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsText(file);
  };

  // === MANUAL ENTRY ===
  const handleManualSave = async () => {
    if (!manualData.sampleId || !manualData.projectId) {
      alert("Sample ID and Project ID are required.");
      return;
    }

    const { error } = await supabase.from("samples").insert([manualData]);
    if (error) {
      console.error(error);
      alert("Error saving sample ❌");
    } else {
      alert("Sample saved successfully ✅");
      setManualData({
        sampleId: "",
        projectId: "",
        district: "",
        city: "",
        latitude: "",
        longitude: "",
        metal: "",
        Si: "",
        Ii: "",
        Mi: "",
        date: "",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* === CSV UPLOAD === */}
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
            className="text-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer"
            onClick={() => document.getElementById("file-upload")?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const file = e.dataTransfer.files?.[0];
              if (file) {
                const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                handleFileUpload(fakeEvent);
              }
            }}
          >
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-4">
              Click to upload or drag and drop your CSV file
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" className="cursor-pointer" disabled={isUploading}>
                {isUploading ? "Processing..." : "Choose File"}
              </Button>
            </label>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Use the provided template to ensure proper format. Required: SampleID, ProjectID, District, City, Latitude, Longitude, Metal, Si, Ii, Mi, Date.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* === MANUAL ENTRY === */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-blue-600" /> Manual Entry
          </CardTitle>
          <CardDescription>Enter sample details manually</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.keys(manualData).map((key) => (
            <Input
              key={key}
              placeholder={key}
              value={(manualData as any)[key]}
              onChange={(e) => setManualData({ ...manualData, [key]: e.target.value })}
            />
          ))}
          <Button onClick={handleManualSave}>Save Sample</Button>
        </CardContent>
      </Card>
    </div>
  );
}
