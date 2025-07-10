"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Plus, X, Building2, FileText } from "lucide-react";
import { useApp } from "@/components/providers";
import { useToast } from "@/hooks/use-toast";

export default function SettingsManager() {
  const { isReady, company, refreshCompany } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Company settings
  const [companyData, setCompanyData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    taxRate: 18,
  });

  // Configuration data
  const [partCategories, setPartCategories] = useState<string[]>([]);
  const [customerTypes, setCustomerTypes] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [newCustomerType, setNewCustomerType] = useState("");

  useEffect(() => {
    if (!isReady || !company) return;
    loadSettings();
  }, [isReady, company]);

  const loadSettings = async () => {
    if (!company) return;

    try {
      setLoading(true);

      // Load company data
      setCompanyData({
        name: company.name,
        address: company.address || "",
        phone: company.phone || "",
        email: company.email || "",
        taxRate: Number.parseFloat(company.taxRate || "18"),
      });

      // Load configurations
      const [categoriesResponse, customerTypesResponse] = await Promise.all([
        fetch("/api/configurations?type=part_categories"),
        fetch("/api/configurations?type=customer_types"),
      ]);

      if (categoriesResponse.ok) {
        const categoriesConfig = await categoriesResponse.json();
        if (categoriesConfig.length > 0) {
          setPartCategories(categoriesConfig[0].configValue as string[]);
        }
      }

      if (customerTypesResponse.ok) {
        const customerTypesConfig = await customerTypesResponse.json();
        if (customerTypesConfig.length > 0) {
          setCustomerTypes(customerTypesConfig[0].configValue as string[]);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company?.id) return;

    try {
      setLoading(true);

      const response = await fetch("/api/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: company.id,
          name: companyData.name,
          address: companyData.address,
          phone: companyData.phone,
          email: companyData.email,
          taxRate: companyData.taxRate.toString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to update company");

      await refreshCompany();

      toast({
        title: "Success",
        description: "Company settings updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update company settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addPartCategory = async () => {
    if (!newCategory.trim()) return;

    const updatedCategories = [...partCategories, newCategory.trim()];
    setPartCategories(updatedCategories);
    setNewCategory("");

    try {
      const response = await fetch("/api/configurations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configType: "part_categories",
          configKey: "categories",
          configValue: updatedCategories,
        }),
      });

      if (!response.ok) throw new Error("Failed to save configuration");

      toast({
        title: "Success",
        description: "Part category added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add part category",
        variant: "destructive",
      });
    }
  };

  const removePartCategory = async (category: string) => {
    const updatedCategories = partCategories.filter((c) => c !== category);
    setPartCategories(updatedCategories);

    try {
      const response = await fetch("/api/configurations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configType: "part_categories",
          configKey: "categories",
          configValue: updatedCategories,
        }),
      });

      if (!response.ok) throw new Error("Failed to save configuration");

      toast({
        title: "Success",
        description: "Part category removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove part category",
        variant: "destructive",
      });
    }
  };

  const addCustomerType = async () => {
    if (!newCustomerType.trim()) return;

    const updatedTypes = [...customerTypes, newCustomerType.trim()];
    setCustomerTypes(updatedTypes);
    setNewCustomerType("");

    try {
      const response = await fetch("/api/configurations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configType: "customer_types",
          configKey: "types",
          configValue: updatedTypes,
        }),
      });

      if (!response.ok) throw new Error("Failed to save configuration");

      toast({
        title: "Success",
        description: "Customer type added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add customer type",
        variant: "destructive",
      });
    }
  };

  const removeCustomerType = async (type: string) => {
    const updatedTypes = customerTypes.filter((t) => t !== type);
    setCustomerTypes(updatedTypes);

    try {
      const response = await fetch("/api/configurations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configType: "customer_types",
          configKey: "types",
          configValue: updatedTypes,
        }),
      });

      if (!response.ok) throw new Error("Failed to save configuration");

      toast({
        title: "Success",
        description: "Customer type removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove customer type",
        variant: "destructive",
      });
    }
  };

  if (!isReady || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your workshop information and preferences
        </p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger
            value="configuration"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* Company Settings */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Basic information about your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCompanySubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={companyData.name}
                      onChange={(e) =>
                        setCompanyData({ ...companyData, name: e.target.value })
                      }
                      placeholder="Your Workshop Name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={companyData.phone}
                      onChange={(e) =>
                        setCompanyData({
                          ...companyData,
                          phone: e.target.value,
                        })
                      }
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={companyData.address}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        address: e.target.value,
                      })
                    }
                    placeholder="123 Main Street, City, State - 123456"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={companyData.email}
                      onChange={(e) =>
                        setCompanyData({
                          ...companyData,
                          email: e.target.value,
                        })
                      }
                      placeholder="info@yourworkshop.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      value={companyData.taxRate}
                      onChange={(e) =>
                        setCompanyData({
                          ...companyData,
                          taxRate: Number.parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="18"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Company Settings
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration */}
        <TabsContent value="configuration">
          <div className="space-y-6">
            {/* Part Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Part Categories</CardTitle>
                <CardDescription>
                  Manage categories for your parts inventory
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Enter new category"
                    onKeyPress={(e) => e.key === "Enter" && addPartCategory()}
                  />
                  <Button
                    onClick={addPartCategory}
                    disabled={!newCategory.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {partCategories.map((category) => (
                    <Badge
                      key={category}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {category}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => removePartCategory(category)}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Customer Types */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Types</CardTitle>
                <CardDescription>
                  Manage different types of customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newCustomerType}
                    onChange={(e) => setNewCustomerType(e.target.value)}
                    placeholder="Enter new customer type"
                    onKeyPress={(e) => e.key === "Enter" && addCustomerType()}
                  />
                  <Button
                    onClick={addCustomerType}
                    disabled={!newCustomerType.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {customerTypes.map((type) => (
                    <Badge
                      key={type}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {type}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => removeCustomerType(type)}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Bill & Quotation Templates</CardTitle>
              <CardDescription>
                Customize your bill and quotation templates (Coming Soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4" />
                <p>
                  Template customization will be available in the next update.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
