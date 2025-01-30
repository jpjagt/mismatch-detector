import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ConfigPanel } from '@/components/ConfigPanel';
import { ResultsTable } from '@/components/ResultsTable';
import { parseCSV, compareData } from '@/lib/csvUtils';
import { ComparisonResult, CSVData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [salesforceData, setSalesforceData] = useState<CSVData[]>([]);
  const [incomingData, setIncomingData] = useState<CSVData[]>([]);
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [salesforceFile, setSalesforceFile] = useState<string>();
  const [incomingFile, setIncomingFile] = useState<string>();
  const { toast } = useToast();

  const handleSalesforceFile = async (file: File) => {
    try {
      const data = await parseCSV(file);
      setSalesforceData(data);
      setSalesforceFile(file.name);
      toast({
        title: "Salesforce file uploaded",
        description: `${data.length} records loaded successfully.`
      });
      if (incomingData.length > 0) {
        const comparisonResults = compareData(data, incomingData);
        setResults(comparisonResults);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse Salesforce CSV file.",
        variant: "destructive"
      });
    }
  };

  const handleIncomingFile = async (file: File) => {
    try {
      const data = await parseCSV(file);
      setIncomingData(data);
      setIncomingFile(file.name);
      toast({
        title: "Incoming file uploaded",
        description: `${data.length} records loaded successfully.`
      });
      if (salesforceData.length > 0) {
        const comparisonResults = compareData(salesforceData, data);
        setResults(comparisonResults);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse incoming CSV file.",
        variant: "destructive"
      });
    }
  };

  const resetSalesforce = () => {
    setSalesforceData([]);
    setSalesforceFile(undefined);
    setResults([]);
  };

  const resetIncoming = () => {
    setIncomingData([]);
    setIncomingFile(undefined);
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4 space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">CSV Comparison Tool</h1>
        
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upload">Upload & Compare</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <FileUpload
                onFileSelect={handleSalesforceFile}
                label="Upload Salesforce Data"
                uploadedFileName={salesforceFile}
                onReset={resetSalesforce}
              />
              <FileUpload
                onFileSelect={handleIncomingFile}
                label="Upload Incoming Data"
                uploadedFileName={incomingFile}
                onReset={resetIncoming}
              />
            </div>
            
            <ResultsTable results={results} />
          </TabsContent>
          
          <TabsContent value="config">
            <ConfigPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;