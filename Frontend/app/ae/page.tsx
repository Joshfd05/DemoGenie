"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Users,
  Clock,
  ExternalLink,
  Download,
  CheckCircle,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Globe,
} from "lucide-react"
import Link from "next/link"

interface Demo {
  id: string
  merchantName: string
  category: string
  scheduledDateTime: string
  aeName: string
  status: "upcoming" | "completed" | "prep-needed"
  meetingLink: string
  address: string
  contactNumber: string
  email: string
  website?: string
  socialMedia?: string
  productsInterested: string
  outlets: string
  painPoints: string
  specialNotes?: string
}

const mockDemos: Demo[] = [
  {
    id: "1",
    merchantName: "Bella Vista Restaurant",
    category: "Fine Dining",
    scheduledDateTime: "2024-01-15T14:00",
    aeName: "Sarah Johnson",
    status: "upcoming",
    meetingLink: "https://meet.google.com/abc-defg-hij",
    address: "123 Main St, Downtown",
    contactNumber: "+1 (555) 123-4567",
    email: "owner@bellavista.com",
    website: "https://bellavista.com",
    socialMedia: "@bellavista_restaurant",
    productsInterested: "Complete Suite",
    outlets: "2-5 Locations",
    painPoints: "Struggling with inventory management across multiple locations",
    specialNotes: "Interested in integration with existing accounting software",
  },
  {
    id: "2",
    merchantName: "Quick Bites Cafe",
    category: "Fast Casual",
    scheduledDateTime: "2024-01-16T10:30",
    aeName: "Mike Chen",
    status: "prep-needed",
    meetingLink: "https://zoom.us/j/123456789",
    address: "456 Oak Ave, Midtown",
    contactNumber: "+1 (555) 987-6543",
    email: "manager@quickbites.com",
    productsInterested: "POS System, Online Ordering",
    outlets: "1 Location",
    painPoints: "Need better online ordering system and delivery integration",
    specialNotes: "Currently using Square, looking to upgrade",
  },
]

export default function AEPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [aeName, setAeName] = useState("")
  const [demos] = useState<Demo[]>(mockDemos)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (aeName.trim()) {
      setIsLoggedIn(true)
    }
  }

  const upcomingDemos = demos.filter((demo) => demo.status === "upcoming")
  const prepNeededDemos = demos.filter((demo) => demo.status === "prep-needed")

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <Card className="glass-strong max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              AE Dashboard Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="aeName">Your Name</Label>
                <Input
                  id="aeName"
                  value={aeName}
                  onChange={(e) => setAeName(e.target.value)}
                  className="glass"
                  placeholder="Enter your name"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Access Dashboard
              </Button>
              <Link href="/" className="block">
                <Button variant="outline" className="w-full bg-transparent">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div className="relative z-10 container mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            <Button variant="outline" onClick={() => setIsLoggedIn(false)}>
              Logout
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Welcome back, {aeName}! 👋</h1>
          <p className="text-muted-foreground">Manage your demo pipeline and preparation briefs</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Demos</p>
                  <p className="text-2xl font-bold">2</p>
                </div>
                <Calendar className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Prep Briefs Pending</p>
                  <p className="text-2xl font-bold">1</p>
                </div>
                <Sparkles className="w-8 h-8 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold">85%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Demo Card */}
        {upcomingDemos.length > 0 && (
          <Card className="glass mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Next Demo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{upcomingDemos[0].merchantName}</h3>
                  <p className="text-muted-foreground">
                    {new Date(upcomingDemos[0].scheduledDateTime).toLocaleString()}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    {upcomingDemos[0].category}
                  </Badge>
                </div>
                <Button asChild>
                  <a href={upcomingDemos[0].meetingLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Join Meeting
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="demos" className="space-y-6">
          <TabsList className="glass">
            <TabsTrigger value="demos">Upcoming Demos</TabsTrigger>
            <TabsTrigger value="briefs">Prep Briefs</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>

          <TabsContent value="demos">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Demo Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {demos.map((demo) => (
                    <div key={demo.id} className="flex items-center justify-between p-4 glass rounded-lg hover-glow">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{demo.merchantName}</h3>
                          <Badge variant={demo.status === "upcoming" ? "default" : "secondary"}>
                            {demo.status === "upcoming" ? "Ready" : "Prep Needed"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {demo.category} • {new Date(demo.scheduledDateTime).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">AE: {demo.aeName}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={demo.meetingLink} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="briefs">
            <div className="space-y-6">
              {demos.map((demo) => (
                <Card key={demo.id} className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{demo.merchantName} - Prep Brief</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </Button>
                        <Button size="sm">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Complete
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{demo.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{demo.contactNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{demo.email}</span>
                        </div>
                        {demo.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                            <a
                              href={demo.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              {demo.website}
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Category</Label>
                          <p className="text-sm">{demo.category}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Products Interested</Label>
                          <p className="text-sm">{demo.productsInterested}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Number of Outlets</Label>
                          <p className="text-sm">{demo.outlets}</p>
                        </div>
                      </div>
                    </div>

                    {/* Pain Points */}
                    <div>
                      <Label className="text-sm font-medium">Current Pain Points</Label>
                      <p className="text-sm mt-1 p-3 bg-muted/30 rounded-lg">{demo.painPoints}</p>
                    </div>

                    {/* AI Insights */}
                    <div className="glass-strong p-4 rounded-lg">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        AI-Generated Insights
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <Label className="font-medium">Company Analysis</Label>
                          <p className="text-muted-foreground">
                            {demo.category} restaurant with {demo.outlets.toLowerCase()} focusing on operational
                            efficiency. Strong online presence suggests tech-savvy management.
                          </p>
                        </div>
                        <div>
                          <Label className="font-medium">Recommended Focus Areas</Label>
                          <p className="text-muted-foreground">
                            Emphasize inventory management features, multi-location reporting, and integration
                            capabilities.
                          </p>
                        </div>
                        <div>
                          <Label className="font-medium">Pitch Suggestions</Label>
                          <p className="text-muted-foreground">
                            Lead with ROI calculations for inventory optimization. Demonstrate real-time reporting
                            across locations.
                          </p>
                        </div>
                      </div>
                    </div>

                    {demo.specialNotes && (
                      <div>
                        <Label className="text-sm font-medium">Special Notes</Label>
                        <p className="text-sm mt-1 p-3 bg-muted/30 rounded-lg">{demo.specialNotes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="calendar">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Weekly Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <div key={day} className="text-center font-medium p-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 35 }, (_, i) => (
                    <div key={i} className="aspect-square p-2 glass rounded-lg hover-glow cursor-pointer">
                      <div className="text-sm">{(i % 31) + 1}</div>
                      {i === 14 && (
                        <div className="text-xs bg-primary text-primary-foreground rounded px-1 mt-1">Bella Vista</div>
                      )}
                      {i === 15 && (
                        <div className="text-xs bg-secondary text-secondary-foreground rounded px-1 mt-1">
                          Quick Bites
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
