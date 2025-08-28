"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
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
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

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
  // Optional fields from backend
  prep_brief_status?: string
}

async function fetchDemos(): Promise<Demo[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
  const res = await fetch(`${baseUrl}/demos`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to load demos")
  const raw = await res.json()
  // Normalize potential backend shapes into the UI Demo interface where possible
  return (raw as any[]).map((item) => {
    const scheduledDateTime =
      item.scheduledDateTime || item.scheduled_time || item.scheduledTime || item.scheduled || new Date().toISOString()
    return {
      id: String(item.id ?? item.merchant_id ?? item.merchantId ?? Math.random().toString(36).slice(2)),
      merchantName: item.merchantName || item.merchant_name || item.merchant || "Merchant",
      category: item.category || "",
      scheduledDateTime,
      aeName: item.aeName || item.ae_name || "",
      status: (item.status as Demo["status"]) || "upcoming",
      meetingLink: item.meetingLink || item.meeting_link || "#",
      address: item.address || "",
      contactNumber: item.contactNumber || item.contact_number || "",
      email: item.email || "",
      website: item.website,
      socialMedia: item.socialMedia,
      productsInterested: item.productsInterested || item.products_interested || "",
      outlets: String(item.outlets ?? ""),
      painPoints: item.painPoints || item.pain_points || "",
      specialNotes: item.specialNotes || item.special_notes,
      prep_brief_status: item.prep_brief_status || item.prepBriefStatus || item.prepStatus || "Pending",
    } as Demo
  })
}

export default function AEPage() {
  const { toast } = useToast()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [aeName, setAeName] = useState("")
  const [demos, setDemos] = useState<Demo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState<Record<string, boolean>>({})
  const [viewing, setViewing] = useState<Record<string, boolean>>({})
  const [briefs, setBriefs] = useState<Record<string, { insights: string; pitch: string; next_steps: string } | null>>({})

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (aeName.trim()) {
      setIsLoggedIn(true)
    }
  }

  useEffect(() => {
    if (!isLoggedIn) return
    let cancelled = false
    setLoading(true)
    fetchDemos()
      .then((data) => {
        if (!cancelled) setDemos(data)
      })
      .catch((err) => {
        console.error(err)
        if (!cancelled) setError("Failed to load demos")
        toast({ title: "Failed to load demos", description: String(err), variant: "destructive" })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isLoggedIn])

  const upcomingDemos = demos.filter((demo) => demo.status === "upcoming")
  const prepNeededDemos = demos.filter((demo) => demo.status === "prep-needed")

  const baseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000", [])

  function mapBriefPayload(raw: any): { insights: string; pitch: string; next_steps: string } {
    // Backend fields: insights, pain_points_summary, relevant_features, pitch_suggestions, status
    const insights = [raw?.insights, raw?.pain_points_summary].filter(Boolean).join("\n\n") || ""
    const pitch = raw?.pitch_suggestions || raw?.pitch || ""
    const nextSteps = raw?.next_steps || raw?.relevant_features || raw?.status || ""
    return { insights, pitch, next_steps: nextSteps }
  }

  async function handleGenerateBrief(merchantId: string) {
    try {
      setGenerating((prev) => ({ ...prev, [merchantId]: true }))
      const res = await fetch(`${baseUrl}/generate-brief/${merchantId}`, {
        method: "POST",
      })
      if (!res.ok) throw new Error(`Failed to generate brief (${res.status})`)
      const data = await res.json()
      // Update brief locally and mark status as Generated
      setBriefs((prev) => ({ ...prev, [merchantId]: mapBriefPayload(data) }))
      setDemos((prev) => prev.map((d) => (d.id === merchantId ? { ...d, prep_brief_status: "Generated" } : d)))
      toast({ title: "Brief generated", description: "Prep brief was generated successfully." })
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: String(err), variant: "destructive" })
    } finally {
      setGenerating((prev) => ({ ...prev, [merchantId]: false }))
    }
  }

  async function handleViewBrief(merchantId: string) {
    try {
      setViewing((prev) => ({ ...prev, [merchantId]: true }))
      const res = await fetch(`${baseUrl}/prep-brief/${merchantId}`, { method: "GET", cache: "no-store" })
      if (!res.ok) throw new Error(`Failed to fetch brief (${res.status})`)
      const data = await res.json()
      setBriefs((prev) => ({ ...prev, [merchantId]: mapBriefPayload(data) }))
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: String(err), variant: "destructive" })
    } finally {
      setViewing((prev) => ({ ...prev, [merchantId]: false }))
    }
  }

  // Dashboard stats
  const stats = useMemo(() => {
    const today = new Date()
    const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
    const todaysCount = demos.reduce((acc, d) => {
      const dt = new Date(d.scheduledDateTime)
      return acc + (isSameDay(today, dt) ? 1 : 0)
    }, 0)
    const total = demos.length
    const generated = demos.reduce((acc, d) => acc + (d.prep_brief_status === "Generated" ? 1 : 0), 0)
    const pending = total - generated
    const rate = total > 0 ? Math.round((generated / total) * 100) : 0
    return { todaysCount, pending, rate }
  }, [demos])

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
                  <p className="text-2xl font-bold">{stats.todaysCount}</p>
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
                  <p className="text-2xl font-bold">{stats.pending}</p>
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
                  <p className="text-2xl font-bold">{stats.rate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Demo Card */}
        {loading && (
          <Card className="glass mb-8">
            <CardHeader>
              <CardTitle>Loading demos…</CardTitle>
            </CardHeader>
          </Card>
        )}
        {error && (
          <Card className="glass mb-8">
            <CardHeader>
              <CardTitle>{error}</CardTitle>
            </CardHeader>
          </Card>
        )}
        {!loading && !error && upcomingDemos.length > 0 && (
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
                  {!loading && demos.map((demo) => (
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
                        <Button
                          size="sm"
                          onClick={() => handleGenerateBrief(demo.id)}
                          disabled={!!generating[demo.id]}
                        >
                          {generating[demo.id] ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate Brief
                            </>
                          )}
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
                        {demo.prep_brief_status === "Generated" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewBrief(demo.id)}
                            disabled={!!viewing[demo.id]}
                          >
                            {viewing[demo.id] ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Loading
                              </>
                            ) : (
                              <>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Brief
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => handleGenerateBrief(demo.id)} disabled={!!generating[demo.id]}>
                            {generating[demo.id] ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate Brief
                              </>
                            )}
                          </Button>
                        )}
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

                    {/* Prep Brief Content */}
                    <div className="glass-strong p-4 rounded-lg">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Prep Brief
                      </h4>
                      {briefs[demo.id] ? (
                        <div className="space-y-3 text-sm">
                          <div>
                            <Label className="font-medium">Insights</Label>
                            <p className="text-muted-foreground whitespace-pre-wrap">{briefs[demo.id]?.insights}</p>
                          </div>
                          <div>
                            <Label className="font-medium">Pitch</Label>
                            <p className="text-muted-foreground whitespace-pre-wrap">{briefs[demo.id]?.pitch}</p>
                          </div>
                          <div>
                            <Label className="font-medium">Next Steps</Label>
                            <p className="text-muted-foreground whitespace-pre-wrap">{briefs[demo.id]?.next_steps}</p>
                          </div>
                        </div>
                      ) : demo.prep_brief_status === "Generated" ? (
                        <p className="text-sm text-muted-foreground">Click "View Brief" to load the latest prep brief.</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">No brief yet. Generate one to get started.</p>
                      )}
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
