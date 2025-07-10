"use client";

import type React from "react";

import { useState, useEffect } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Edit,
  Trash2,
  AlertTriangle,
  Package,
} from "lucide-react";
import type { Part } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";
import { useLiveParts } from "@/hooks/use-live-data";

export default function PartsManager() {
  const { toast } = useToast();
  const { parts, loading } = useLiveParts();
  const [filteredParts, setFilteredParts] = useState<Part[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    partName: "",
    partCode: "",
    category: "",
    unitPrice: "",
    quantity: "",
    minQuantity: "",
    notes: "",
  });

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  // Filter parts whenever parts, search, or category changes
  useEffect(() => {
    let filtered = parts;

    if (searchTerm) {
      filtered = filtered.filter(
        (part) =>
          part.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          part.partCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((part) => part.category === selectedCategory);
    }

    setFilteredParts(filtered);
  }, [parts, searchTerm, selectedCategory]);

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/configurations?type=part_categories");
      if (response.ok) {
        const configs = await response.json();
        if (configs.length > 0) {
          setCategories(configs[0].configValue as string[]);
        }
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      partName: "",
      partCode: "",
      category: "",
      unitPrice: "",
      quantity: "",
      minQuantity: "",
      notes: "",
    });
    setEditingPart(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const partData = {
        partName: formData.partName,
        partCode: formData.partCode,
        category: formData.category,
        unitPrice: formData.unitPrice,
        quantity: Number.parseInt(formData.quantity),
        minQuantity: Number.parseInt(formData.minQuantity),
        notes: formData.notes,
        isActive: true,
      };

      if (editingPart?.id) {
        const response = await fetch(`/api/parts/${editingPart.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(partData),
        });

        if (!response.ok) throw new Error("Failed to update part");

        toast({
          title: "Success",
          description: "Part updated successfully",
        });
      } else {
        const response = await fetch("/api/parts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(partData),
        });

        if (!response.ok) throw new Error("Failed to create part");

        toast({
          title: "Success",
          description: "Part added successfully",
        });
      }

      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save part",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (part: Part) => {
    setEditingPart(part);
    setFormData({
      partName: part.partName,
      partCode: part.partCode,
      category: part.category,
      unitPrice: part.unitPrice,
      quantity: part.quantity.toString(),
      minQuantity: part.minQuantity.toString(),
      notes: part.notes || "",
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (part: Part) => {
    if (!part.id) return;

    if (confirm(`Are you sure you want to delete ${part.partName}?`)) {
      try {
        const response = await fetch(`/api/parts/${part.id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to delete part");

        toast({
          title: "Success",
          description: "Part deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to delete part",
          variant: "destructive",
        });
      }
    }
  };

  const getStockStatus = (part: Part) => {
    if (part.quantity === 0)
      return { status: "out", color: "destructive" as const };
    if (part.quantity <= part.minQuantity)
      return { status: "low", color: "secondary" as const };
    return { status: "good", color: "default" as const };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading parts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Parts Management
          </h1>
          <p className="text-muted-foreground">
            Manage your workshop inventory
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Part
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingPart ? "Edit Part" : "Add New Part"}
              </DialogTitle>
              <DialogDescription>
                {editingPart
                  ? "Update part information"
                  : "Add a new part to your inventory"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="partName" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="partName"
                    value={formData.partName}
                    onChange={(e) =>
                      setFormData({ ...formData, partName: e.target.value })
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="partCode" className="text-right">
                    Code
                  </Label>
                  <Input
                    id="partCode"
                    value={formData.partCode}
                    onChange={(e) =>
                      setFormData({ ...formData, partCode: e.target.value })
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Category
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unitPrice" className="text-right">
                    Price (₹)
                  </Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, unitPrice: e.target.value })
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantity" className="text-right">
                    Quantity
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="minQuantity" className="text-right">
                    Min Qty
                  </Label>
                  <Input
                    id="minQuantity"
                    type="number"
                    value={formData.minQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, minQuantity: e.target.value })
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingPart ? "Update Part" : "Add Part"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search parts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Parts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredParts.map((part) => {
          const stockStatus = getStockStatus(part);
          return (
            <Card key={part.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{part.partName}</CardTitle>
                    <CardDescription>{part.partCode}</CardDescription>
                  </div>
                  <Badge variant={stockStatus.color}>
                    {stockStatus.status === "out"
                      ? "Out of Stock"
                      : stockStatus.status === "low"
                      ? "Low Stock"
                      : "In Stock"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Category:
                    </span>
                    <span className="text-sm">{part.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Price:
                    </span>
                    <span className="text-sm font-medium">
                      ₹{Number.parseFloat(part.unitPrice).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Stock:
                    </span>
                    <span className="text-sm">
                      {part.quantity} / {part.minQuantity} min
                      {part.quantity <= part.minQuantity && (
                        <AlertTriangle className="inline h-3 w-3 ml-1 text-orange-500" />
                      )}
                    </span>
                  </div>
                  {part.notes && (
                    <div className="text-xs text-muted-foreground mt-2">
                      {part.notes}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(part)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(part)}
                    className="flex-1"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredParts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No parts found</h3>
          <p className="text-muted-foreground">
            {searchTerm || selectedCategory !== "all"
              ? "Try adjusting your search or filters"
              : "Add your first part to get started"}
          </p>
        </div>
      )}
    </div>
  );
}
