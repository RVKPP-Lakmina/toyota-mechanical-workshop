"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Save, Plus, X, Building2, Palette, FileText, Trash2 } from "lucide-react"
import { companyService, configurationService, fileUploadService } from "@/lib/database"
import { useApp } from "@/components/providers"
import { useToast } from "@/hooks/use-toast"

export default function SettingsManager() {
  const { isReady, company, companyId, refreshCompany } = useApp()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // Company settings
  const [companyData, setCompanyData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    taxRate: 18,
  })

  // Configuration data
  const [partCategories, setPartCategories] = useState<string[]>([])
  const [customerTypes, setCustomerTypes] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState("")
  const [newCustomerType, setNewCustomerType] = useState("")

  // Logo management
  const [logos, setLogos] = useState<any[]>([])
  const [activeLogo, setActiveLogo] = useState<string | null>(null)

  useEffect(() => {
    if (!isReady || !company || !companyId) return
    loadSettings()
  }, [isReady, company, companyId])

  const loadSettings = async () => {
    if (!company || !companyId) return

    try {
      setLoading(true)

      // Load company data
      setCompanyData({
        name: company.name,
        address: company.address || "",
        phone: company.phone || "",
        email: company.email || "",
        taxRate: Number.parseFloat(company.taxRate || "18"),
      })

      // Load configurations
      const [categoriesConfig, customerTypesConfig] = await Promise.all([
        configurationService.getByType(companyId, "part_categories"),
        configurationService.getByType(companyId, "customer_types"),
      ])

      if (categoriesConfig.length > 0) {
        setPartCategories(categoriesConfig[0].configValue as string[])
      }

      if (customerTypesConfig.length > 0) {
        setCustomerTypes(customerTypesConfig[0].configValue as string[])
      }

      // Load logos
      const logoFiles = await fileUploadService.getByCategory(companyId, "logo")
      setLogos(logoFiles)
      setActiveLogo(company.logoUrl || null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    try {
      setLoading(true)
      await companyService.update(companyId, {
        name: companyData.name,
        address: companyData.address,
        phone: companyData.phone,
        email: companyData.email,
        taxRate: companyData.taxRate.toString(),
        logoUrl: activeLogo,
      })

      await refreshCompany()

      toast({
        title: "Success",
        description: "Company settings updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update company settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !companyId) return

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select a valid image file",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size should be less than 5MB",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Convert to base64 for storage (in production, use cloud storage)
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result as string

        try {
          const logoFile = await fileUploadService.create({
            companyId,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            fileUrl: base64,
            fileCategory: "logo",
          })

          setLogos((prev) => [logoFile, ...prev])

          toast({
            title: "Success",
            description: "Logo uploaded successfully",
          })
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to save logo",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }

      reader.readAsDataURL(file)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const setAsActiveLogo = (logoUrl: string) => {
    setActiveLogo(logoUrl)
    toast({
      title: "Success",
      description: "Logo set as active. Save company settings to apply.",
    })
  }

  const deleteLogo = async (logoId: string) => {
    try {
      await fileUploadService.delete(logoId)
      setLogos((prev) => prev.filter((logo) => logo.id !== logoId))

      // If deleted logo was active, clear it
      const deletedLogo = logos.find((logo) => logo.id === logoId)
      if (deletedLogo && activeLogo === deletedLogo.fileUrl) {
        setActiveLogo(null)
      }

      toast({
        title: "Success",
        description: "Logo deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete logo",
        variant: "destructive",
      })
    }
  }

  const addPartCategory = async () => {
    if (!newCategory.trim() || !companyId) return

    const updatedCategories = [...partCategories, newCategory.trim()]
    setPartCategories(updatedCategories)
    setNewCategory("")

    try {
      await configurationService.upsert(companyId, "part_categories", "categories", updatedCategories)
      toast({
        title: "Success",
        description: "Part category added successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add part category",
        variant: "destructive",
      })
    }
  }

  const removePartCategory = async (category: string) => {
    const updatedCategories = partCategories.filter((c) => c !== category)
    setPartCategories(updatedCategories)

    try {
      await configurationService.upsert(companyId!, "part_categories", "categories", updatedCategories)
      toast({
        title: "Success",
        description: "Part category removed successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove part category",
        variant: "destructive",
      })
    }
  }

  const addCustomerType = async () => {
    if (!newCustomerType.trim() || !companyId) return

    const updatedTypes = [...customerTypes, newCustomerType.trim()]
    setCustomerTypes(updatedTypes)
    setNewCustomerType("")

    try {
      await configurationService.upsert(companyId, "customer_types", "types", updatedTypes)
      toast({
        title: "Success",
        description: "Customer type added successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add customer type",
        variant: "destructive",
      })
    }
  }

  const removeCustomerType = async (type: string) => {
    const updatedTypes = customerTypes.filter((t) => t !== type)
    setCustomerTypes(updatedTypes)

    try {
      await configurationService.upsert(companyId!, "customer_types", "types", updatedTypes)
      toast({
        title: "Success",
        description: "Customer type removed successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove customer type",
        variant: "destructive",
      })
    }
  }

  if (!isReady || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your workshop information and preferences</p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="configuration" className="flex items-center gap-2">
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
              <CardDescription>Basic information about your business</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCompanySubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={companyData.name}
                      onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                      placeholder="Your Workshop Name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={companyData.phone}
                      onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
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
                    onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
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
                      onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
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
                        setCompanyData({ ...companyData, taxRate: Number.parseFloat(e.target.value) || 0 })
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

        {/* Branding */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Logo Management</CardTitle>
              <CardDescription>Upload and manage your company logos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload new logo */}
              <div>
                <Label htmlFor="logoUpload" className="cursor-pointer">
                  <Button type="button" variant="outline" asChild disabled={loading}>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload New Logo
                    </span>
                  </Button>
                </Label>
                <Input id="logoUpload" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                <p className="text-xs text-muted-foreground mt-2">
                  Supported formats: PNG, JPG, JPEG. Maximum size: 5MB
                </p>
              </div>

              {/* Logo gallery */}
              {logos.length > 0 && (
                <div>
                  <h4 className="font-medium mb-4">Your Logos</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {logos.map((logo) => (
                      <div key={logo.id} className="relative group">
                        <div
                          className={`border-2 rounded-lg p-2 ${activeLogo === logo.fileUrl ? "border-primary" : "border-border"}`}
                        >
                          <img
                            src={logo.fileUrl || "/placeholder.svg"}
                            alt={logo.fileName}
                            className="w-full h-20 object-contain"
                          />
                        </div>
                        {activeLogo === logo.fileUrl && <Badge className="absolute -top-2 -right-2">Active</Badge>}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                          {activeLogo !== logo.fileUrl && (
                            <Button size="sm" onClick={() => setAsActiveLogo(logo.fileUrl)}>
                              Set Active
                            </Button>
                          )}
                          <Button size="sm" variant="destructive" onClick={() => deleteLogo(logo.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                <CardDescription>Manage categories for your parts inventory</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Enter new category"
                    onKeyPress={(e) => e.key === "Enter" && addPartCategory()}
                  />
                  <Button onClick={addPartCategory} disabled={!newCategory.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {partCategories.map((category) => (
                    <Badge key={category} variant="secondary" className="flex items-center gap-1">
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
                <CardDescription>Manage different types of customers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newCustomerType}
                    onChange={(e) => setNewCustomerType(e.target.value)}
                    placeholder="Enter new customer type"
                    onKeyPress={(e) => e.key === "Enter" && addCustomerType()}
                  />
                  <Button onClick={addCustomerType} disabled={!newCustomerType.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {customerTypes.map((type) => (
                    <Badge key={type} variant="secondary" className="flex items-center gap-1">
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
              <CardDescription>Customize your bill and quotation templates (Coming Soon)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4" />
                <p>Template customization will be available in the next update.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
