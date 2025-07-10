"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Eye,
  FileText,
  ArrowRight,
  Printer,
  Share2,
} from "lucide-react";
import { billsService, type Bill } from "@/lib/database";
import { useApp } from "@/components/providers";
import { useToast } from "@/hooks/use-toast";
import { useLiveBills } from "@/hooks/use-live-data";
import { PrintTemplate } from "@/components/print-template";
import { useReactToPrint } from "react-to-print";
import Link from "next/link";

export default function QuotationsManager() {
  const { isReady, companyId, company } = useApp();
  const { toast } = useToast();
  const { bills: allBills, loading } = useLiveBills();
  const [quotations, setQuotations] = useState<Bill[]>([]);
  const [filteredQuotations, setFilteredQuotations] = useState<Bill[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedQuotation, setSelectedQuotation] = useState<Bill | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (allBills) {
      const quotationsOnly = allBills.filter(
        (bill) => bill.type === "quotation"
      );
      setQuotations(quotationsOnly);
    }
  }, [allBills]);

  useEffect(() => {
    filterQuotations();
  }, [quotations, searchTerm, statusFilter]);

  const filterQuotations = () => {
    let filtered = quotations;

    if (searchTerm) {
      filtered = filtered.filter(
        (quotation) =>
          quotation.customerName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          quotation.billNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (quotation) => quotation.status === statusFilter
      );
    }

    setFilteredQuotations(filtered);
  };

  const handleViewQuotation = (quotation: Bill) => {
    setSelectedQuotation(quotation);
    setIsViewDialogOpen(true);
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Quotation-${selectedQuotation?.billNumber}`,
  });

  const handleShare = async (quotation: Bill) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Quotation ${quotation.billNumber}`,
          text: `Quotation for ${
            quotation.customerName
          } - Total: Rs. ${Number.parseFloat(quotation.total).toFixed(2)}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `Quotation ${quotation.billNumber}\nCustomer: ${
        quotation.customerName
      }\nTotal: Rs. ${Number.parseFloat(quotation.total).toFixed(
        2
      )}\nDate: ${new Date(quotation.createdAt).toLocaleDateString()}`;

      try {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Copied to clipboard",
          description: "Quotation details copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy quotation details",
          variant: "destructive",
        });
      }
    }
  };

  const convertToBill = async (quotation: Bill) => {
    if (!companyId) return;

    try {
      const billNumber = await billsService.generateBillNumber(
        companyId,
        "bill"
      );

      const billData = {
        companyId,
        customerId: quotation.customerId,
        billNumber,
        customerName: quotation.customerName,
        customerPhone: quotation.customerPhone,
        customerAddress: quotation.customerAddress,
        items: quotation.items,
        subtotal: quotation.subtotal,
        taxRate: quotation.taxRate,
        taxAmount: quotation.taxAmount,
        total: quotation.total,
        type: "bill" as const,
        status: "completed" as const,
        notes: quotation.notes,
      };

      await billsService.create(billData);

      toast({
        title: "Success",
        description: "Quotation converted to bill successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to convert quotation to bill",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "draft":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (!isReady || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading quotations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Quotations Management
          </h1>
          <p className="text-muted-foreground">
            Manage customer quotations and estimates
          </p>
        </div>

        <Link href="/quotations/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Quotation
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quotations by customer name or quotation number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quotations List */}
      <div className="space-y-4">
        {filteredQuotations.map((quotation) => (
          <Card key={quotation.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    Quotation #{quotation.billNumber}
                  </CardTitle>
                  <CardDescription>
                    {quotation.customerName} •{" "}
                    {new Date(quotation.createdAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(quotation.status)}>
                    {quotation.status}
                  </Badge>
                  <span className="text-lg font-bold">
                    Rs. {Number.parseFloat(quotation.total).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {Array.isArray(quotation.items) ? quotation.items.length : 0}{" "}
                  item(s) • Subtotal: Rs.
                  {Number.parseFloat(quotation.subtotal).toFixed(2)} • Tax: Rs.
                  {Number.parseFloat(quotation.taxAmount).toFixed(2)}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewQuotation(quotation)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare(quotation)}
                  >
                    <Share2 className="h-3 w-3 mr-1" />
                    Share
                  </Button>
                  {quotation.status === "completed" && (
                    <Button size="sm" onClick={() => convertToBill(quotation)}>
                      <ArrowRight className="h-3 w-3 mr-1" />
                      Convert to Bill
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredQuotations.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No quotations found</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Create your first quotation to get started"}
          </p>
        </div>
      )}

      {/* View Quotation Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle>
                  Quotation #{selectedQuotation?.billNumber}
                </DialogTitle>
                <DialogDescription>
                  Quotation details for {selectedQuotation?.customerName}
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    selectedQuotation && handleShare(selectedQuotation)
                  }
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </DialogHeader>

          {selectedQuotation && company && (
            <PrintTemplate
              ref={printRef}
              bill={selectedQuotation}
              company={company}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
