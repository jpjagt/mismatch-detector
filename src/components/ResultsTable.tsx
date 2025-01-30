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

interface ResultsTableProps {
  results: ComparisonResult[];
}

export const ResultsTable = ({ results }: ResultsTableProps) => {
  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No mismatches found or no data uploaded yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          Mismatches Found: {results.length}
        </h2>
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
            {results.map((result) => (
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