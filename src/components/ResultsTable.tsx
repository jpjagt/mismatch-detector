import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ComparisonResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Download, ClipboardCopy } from "lucide-react";
import { exportToCSV } from "@/lib/csvUtils";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ResultsTableProps {
  results: ComparisonResult[];
}

export const ResultsTable = ({ results }: ResultsTableProps) => {
  const [showMatches, setShowMatches] = useState(false);
  const [copiedRows, setCopiedRows] = useState<Set<string>>(new Set());
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();

  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No mismatches found or no data uploaded yet.
      </div>
    );
  }

  const filteredResults = showMatches 
    ? results 
    : results.filter(result => 
        (result.statusMismatch || 
        result.premiumMismatch || 
        result.productMismatch) &&
        result.salesforceStatus !== 'Not Found'
      );

  // Calculate statistics
  const mismatchCount = results.filter(result => 
    (result.statusMismatch || 
    result.premiumMismatch || 
    result.productMismatch) &&
    result.salesforceStatus !== 'Not Found'
  ).length;

  const notInSalesforceCount = results.filter(result => 
    result.salesforceStatus === 'Not Found'
  ).length;

  const matchingRecords = results.filter(result => 
    !result.statusMismatch && 
    !result.premiumMismatch && 
    !result.productMismatch &&
    result.salesforceStatus !== 'Not Found'
  ).length;

  const totalRecords = results.length;
  const matchPercentage = ((matchingRecords / totalRecords) * 100).toFixed(1);

  const handleCopyPolicyId = async (policyId: string) => {
    try {
      await navigator.clipboard.writeText(policyId);
      setCopiedRows(prev => new Set([...prev, policyId]));
      setHasCopied(true);
      toast({
        title: "Copied!",
        description: `Policy ID ${policyId} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy policy ID to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Statistics</h2>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>Total records in incoming file: {totalRecords}</li>
              <li>Records with mismatches: {mismatchCount}</li>
              <li>Records not found in Salesforce: {notInSalesforceCount}</li>
              <li>Perfectly matching records: {matchingRecords} ({matchPercentage}%)</li>
            </ul>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showMatches"
              checked={showMatches}
              onCheckedChange={(checked) => setShowMatches(checked as boolean)}
            />
            <label
              htmlFor="showMatches"
              className="text-sm text-gray-600 cursor-pointer"
            >
              Show matching rows
            </label>
          </div>
        </div>
        <Button onClick={() => exportToCSV(results)}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
      
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Policy ID</TableHead>
              <TableHead>Status (SF/Incoming)</TableHead>
              <TableHead>Premium (SF/Incoming)</TableHead>
              <TableHead>Product (SF/Incoming)</TableHead>
              <TableHead>Mismatches</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResults.map((result) => (
              <TableRow key={result.policyId}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {result.policyId}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyPolicyId(result.policyId)}
                      className="h-8 w-8"
                    >
                      <ClipboardCopy className="h-4 w-4" />
                    </Button>
                    {hasCopied && (
                      <Checkbox
                        checked={copiedRows.has(result.policyId)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setCopiedRows(prev => new Set([...prev, result.policyId]));
                          } else {
                            setCopiedRows(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(result.policyId);
                              return newSet;
                            });
                          }
                        }}
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className={result.statusMismatch ? "text-red-600" : ""}>
                    {result.salesforceStatus} / {result.incomingStatus}
                  </div>
                </TableCell>
                <TableCell>
                  <div className={result.premiumMismatch ? "text-red-600" : ""}>
                    {result.salesforcePremium} / {result.incomingPremium}
                  </div>
                </TableCell>
                <TableCell>
                  <div className={result.productMismatch ? "text-red-600" : ""}>
                    {result.salesforceProduct} / {result.incomingProduct}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {result.statusMismatch && "❌ Status"}
                    {result.premiumMismatch && "❌ Premium"}
                    {result.productMismatch && "❌ Product"}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};