import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ProductMapping, StatusMapping } from '@/lib/types';
import { getProductMapping, getStatusMapping, saveProductMapping, saveStatusMapping } from '@/lib/mappingUtils';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export const ConfigPanel = () => {
  const [productMappings, setProductMappings] = useState<ProductMapping[]>([]);
  const [statusMappings, setStatusMappings] = useState<StatusMapping[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setProductMappings(getProductMapping());
    setStatusMappings(getStatusMapping());
  }, []);

  const handleSave = () => {
    saveProductMapping(productMappings);
    saveStatusMapping(statusMappings);
    toast({
      title: "Mappings saved",
      description: "Your configuration has been saved successfully."
    });
  };

  const addProductMapping = () => {
    setProductMappings([...productMappings, { 
      salesforce: '', 
      incoming: '', 
      includeTieredRisk: false,
      tieredRiskValue: ''
    }]);
  };

  const addStatusMapping = () => {
    setStatusMappings([...statusMappings, { salesforce: '', incoming: '' }]);
  };

  const removeProductMapping = (index: number) => {
    setProductMappings(productMappings.filter((_, i) => i !== index));
  };

  const removeStatusMapping = (index: number) => {
    setStatusMappings(statusMappings.filter((_, i) => i !== index));
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Configuration</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Status Mappings</h3>
          {statusMappings.map((mapping, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <Input
                placeholder="Salesforce Status"
                value={mapping.salesforce}
                onChange={(e) => {
                  const newMappings = [...statusMappings];
                  newMappings[index].salesforce = e.target.value;
                  setStatusMappings(newMappings);
                }}
              />
              <Input
                placeholder="Incoming Status"
                value={mapping.incoming}
                onChange={(e) => {
                  const newMappings = [...statusMappings];
                  newMappings[index].incoming = e.target.value;
                  setStatusMappings(newMappings);
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeStatusMapping(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={addStatusMapping}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Status Mapping
          </Button>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Product Mappings</h3>
          {productMappings.map((mapping, index) => (
            <div key={index} className="space-y-2 mb-4 p-4 border rounded-lg">
              <div className="flex gap-2">
                <Input
                  placeholder="Salesforce Product"
                  value={mapping.salesforce}
                  onChange={(e) => {
                    const newMappings = [...productMappings];
                    newMappings[index].salesforce = e.target.value;
                    setProductMappings(newMappings);
                  }}
                />
                <Input
                  placeholder="Incoming Product"
                  value={mapping.incoming}
                  onChange={(e) => {
                    const newMappings = [...productMappings];
                    newMappings[index].incoming = e.target.value;
                    setProductMappings(newMappings);
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeProductMapping(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`tieredRisk-${index}`}
                    checked={mapping.includeTieredRisk}
                    onCheckedChange={(checked) => {
                      const newMappings = [...productMappings];
                      newMappings[index].includeTieredRisk = checked as boolean;
                      setProductMappings(newMappings);
                    }}
                  />
                  <Label htmlFor={`tieredRisk-${index}`}>Include Tiered Risk</Label>
                </div>
                
                {mapping.includeTieredRisk && (
                  <Input
                    placeholder="Expected Tiered Risk Value"
                    value={mapping.tieredRiskValue}
                    onChange={(e) => {
                      const newMappings = [...productMappings];
                      newMappings[index].tieredRiskValue = e.target.value;
                      setProductMappings(newMappings);
                    }}
                    className="flex-1 ml-4"
                  />
                )}
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={addProductMapping}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product Mapping
          </Button>
        </div>

        <Button onClick={handleSave} className="w-full">
          Save Configuration
        </Button>
      </div>
    </Card>
  );
};