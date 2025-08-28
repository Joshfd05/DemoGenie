"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, CheckCircle, ArrowLeft, Loader2, X, Check } from "lucide-react"
import Link from "next/link"

interface FormData {
  merchantName: string
  address: string
  contactNumber: string
  email: string
  productsInterested: string[]
  preferredDateTime: string
  website: string
  socialMedia: string
  category: string
  outlets: string
  painPoints: string
  specialNotes: string
}

interface DemoConfirmation {
  merchantName: string
  aeName: string
  scheduledDateTime: string
  meetingLink: string
}

export default function MerchantPage() {
  const [formData, setFormData] = useState<FormData>({
    merchantName: "",
    address: "",
    contactNumber: "",
    email: "",
    productsInterested: [],
    preferredDateTime: "",
    website: "",
    socialMedia: "",
    category: "",
    outlets: "",
    painPoints: "",
    specialNotes: "",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [confirmation, setConfirmation] = useState<DemoConfirmation | null>(null)
  const [isProductsOpen, setIsProductsOpen] = useState(false)

  const productOptions = [
    { value: "POS", label: "POS" },
    { value: "KIOSK", label: "KIOSK" },
    { value: "MERCHANT WEB", label: "MERCHANT WEB" },
    { value: "WEBSTORE", label: "WEBSTORE" },
    { value: "MOBILE APP", label: "MOBILE APP" },
  ]

  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleProduct = (product: string) => {
    const currentProducts = formData.productsInterested
    if (currentProducts.includes(product)) {
      handleInputChange(
        "productsInterested",
        currentProducts.filter((p) => p !== product),
      )
    } else {
      handleInputChange("productsInterested", [...currentProducts, product])
    }
  }

  const selectAllProducts = () => {
    const allProducts = productOptions.map((p) => p.value)
    if (formData.productsInterested.length === allProducts.length) {
      handleInputChange("productsInterested", [])
    } else {
      handleInputChange("productsInterested", allProducts)
    }
  }

  const removeProduct = (product: string) => {
    handleInputChange(
      "productsInterested",
      formData.productsInterested.filter((p) => p !== product),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
      const res = await fetch(`${baseUrl}/book-demo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_name: formData.merchantName,
          address: formData.address,
          contact_number: formData.contactNumber,
          email: formData.email,
          products_interested: formData.productsInterested,
          preferred_time: formData.preferredDateTime,
          website_links: formData.website || null,
          social_media: formData.socialMedia || null,
          restaurant_category: formData.category,
          number_of_outlets: formData.outlets,
          current_pain_points: formData.painPoints || "",
          special_notes: formData.specialNotes || null,
        }),
      })
      if (!res.ok) {
        throw new Error(`Failed to book demo: ${res.status}`)
      }
      const data: DemoConfirmation = await res.json()
      setConfirmation(data)
    } catch (err) {
      console.error(err)
      setConfirmation({
        merchantName: formData.merchantName,
        aeName: "",
        scheduledDateTime: formData.preferredDateTime,
        meetingLink: "",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <Card className="glass-strong max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Scheduling your demo...</h2>
            <p className="text-muted-foreground">Finding the perfect AE for your needs</p>
            <div className="mt-6 bg-muted/50 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: "70%" }} />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (confirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <Card className="glass-strong max-w-lg w-full animate-in slide-in-from-bottom-4 duration-500">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4">Demo Confirmed! 🎉</h2>

            <div className="space-y-4 text-left bg-muted/30 rounded-lg p-4 mb-6">
              <div>
                <Label className="text-sm font-medium">Restaurant</Label>
                <p className="text-lg">{confirmation.merchantName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Assigned AE</Label>
                <p className="text-lg">{confirmation.aeName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Scheduled Time</Label>
                <p className="text-lg">{confirmation.scheduledDateTime}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Meeting Link</Label>
                <a
                  href={confirmation.meetingLink}
                  className="text-primary hover:underline break-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {confirmation.meetingLink}
                </a>
              </div>
            </div>

            <p className="text-muted-foreground mb-6 text-pretty">
              Your AE will prepare a tailored demo specifically for your restaurant's needs!
            </p>

            <div className="flex gap-3">
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full bg-transparent">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back Home
                </Button>
              </Link>
              <Button className="flex-1">Book Another Demo</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div className="relative z-10 container mx-auto px-4 max-w-2xl">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gradient mb-2">Book Your Demo</h1>
          <p className="text-muted-foreground">Tell us about your restaurant and we'll match you with the perfect AE</p>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Demo Booking Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="merchantName">Restaurant Name *</Label>
                  <Input
                    id="merchantName"
                    value={formData.merchantName}
                    onChange={(e) => handleInputChange("merchantName", e.target.value)}
                    className="glass"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Restaurant Category *</Label>
                  <Select onValueChange={(value) => handleInputChange("category", value)} required>
                    <SelectTrigger className="glass">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fast-casual">Fast Casual</SelectItem>
                      <SelectItem value="fine-dining">Fine Dining</SelectItem>
                      <SelectItem value="quick-service">Quick Service</SelectItem>
                      <SelectItem value="cafe">Cafe</SelectItem>
                      <SelectItem value="food-truck">Food Truck</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="glass"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactNumber">Contact Number *</Label>
                  <Input
                    id="contactNumber"
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => handleInputChange("contactNumber", e.target.value)}
                    className="glass"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="glass"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="productsInterested">Products Interested In *</Label>
                <div className="relative">
                  <div
                    className="glass min-h-[40px] p-3 rounded-md border cursor-pointer flex flex-wrap items-center gap-2"
                    onClick={() => setIsProductsOpen(!isProductsOpen)}
                  >
                    {formData.productsInterested.length === 0 ? (
                      <span className="text-muted-foreground">Select products</span>
                    ) : (
                      formData.productsInterested.map((product) => (
                        <span
                          key={product}
                          className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm flex items-center gap-1"
                        >
                          {product}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeProduct(product)
                            }}
                            className="hover:bg-primary/20 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {isProductsOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 glass-strong rounded-md border z-50 max-h-60 overflow-auto">
                      <div className="p-2">
                        <button
                          type="button"
                          onClick={selectAllProducts}
                          className="w-full text-left px-3 py-2 hover:bg-primary/10 rounded-md flex items-center gap-2 text-sm font-medium"
                        >
                          <Check
                            className={`w-4 h-4 ${formData.productsInterested.length === productOptions.length ? "text-primary" : "text-transparent"}`}
                          />
                          {formData.productsInterested.length === productOptions.length ? "Deselect All" : "Select All"}
                        </button>
                        <div className="border-t border-border/50 my-1" />
                        {productOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => toggleProduct(option.value)}
                            className="w-full text-left px-3 py-2 hover:bg-primary/10 rounded-md flex items-center gap-2"
                          >
                            <Check
                              className={`w-4 h-4 ${formData.productsInterested.includes(option.value) ? "text-primary" : "text-transparent"}`}
                            />
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {formData.productsInterested.length === 0 && (
                  <p className="text-sm text-destructive mt-1">Please select at least one product</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preferredDateTime">Preferred Date & Time *</Label>
                  <Input
                    id="preferredDateTime"
                    type="datetime-local"
                    value={formData.preferredDateTime}
                    onChange={(e) => handleInputChange("preferredDateTime", e.target.value)}
                    className="glass"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="outlets">Number of Outlets</Label>
                  <Select onValueChange={(value) => handleInputChange("outlets", value)}>
                    <SelectTrigger className="glass">
                      <SelectValue placeholder="Select outlets" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Location</SelectItem>
                      <SelectItem value="2-5">2-5 Locations</SelectItem>
                      <SelectItem value="6-10">6-10 Locations</SelectItem>
                      <SelectItem value="11+">11+ Locations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    className="glass"
                    placeholder="https://yourrestaurant.com"
                  />
                </div>
                <div>
                  <Label htmlFor="socialMedia">Social Media</Label>
                  <Input
                    id="socialMedia"
                    value={formData.socialMedia}
                    onChange={(e) => handleInputChange("socialMedia", e.target.value)}
                    className="glass"
                    placeholder="@yourrestaurant"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="painPoints">Current Pain Points</Label>
                <Textarea
                  id="painPoints"
                  value={formData.painPoints}
                  onChange={(e) => handleInputChange("painPoints", e.target.value)}
                  className="glass min-h-[100px]"
                  placeholder="What challenges are you facing with your current setup?"
                />
              </div>

              <div>
                <Label htmlFor="specialNotes">Special Notes</Label>
                <Textarea
                  id="specialNotes"
                  value={formData.specialNotes}
                  onChange={(e) => handleInputChange("specialNotes", e.target.value)}
                  className="glass"
                  placeholder="Any specific requirements or questions?"
                />
              </div>

              <Button type="submit" className="w-full hover-glow" disabled={formData.productsInterested.length === 0}>
                <Clock className="w-4 h-4 mr-2" />
                Schedule Demo
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
