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
import { Download } from "lucide-react";
import { exportToCSV } from "@/lib/csvUtils";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

interface ResultsTableProps {
  results: ComparisonResult[];
}

export const ResultsTable = ({ results }: ResultsTableProps) => {
  const [showMatches, setShowMatches] = useState(false);

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
        result.statusMismatch || 
        result.premiumMismatch || 
        result.productMismatch
      );

  const mismatchCount = results.filter(result => 
    result.statusMismatch || 
    result.premiumMismatch || 
    result.productMismatch
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">
            Mismatches Found: {mismatchCount}
          </h2>
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
                <TableCell>{result.policyId}</TableCell>
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