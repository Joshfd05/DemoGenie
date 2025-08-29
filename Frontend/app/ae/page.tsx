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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  FileText,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import jsPDF from "jspdf"

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
  const [previewModalOpen, setPreviewModalOpen] = useState<string | null>(null)
  const [generatingPDF, setGeneratingPDF] = useState<Record<string, boolean>>({})
  const [markingComplete, setMarkingComplete] = useState<Record<string, boolean>>({})

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
    // Enhanced backend fields: insights (company_insights), pain_points_summary, relevant_features, pitch_suggestions
    const insights = [raw?.insights, raw?.pain_points_summary].filter(Boolean).join("\n\n") || ""
    const pitch = raw?.pitch_suggestions || raw?.pitch || ""
    const nextSteps = raw?.relevant_features || raw?.next_steps || raw?.status || ""
    return { insights, pitch, next_steps: nextSteps }
  }

  const handleMarkComplete = async (demo: Demo) => {
    if (markingComplete[demo.id]) return
    
    setMarkingComplete(prev => ({ ...prev, [demo.id]: true }))
    
    try {
      const response = await fetch(`${baseUrl}/demos/${demo.id}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        // Update local state
        setDemos(prev => prev.map(d => 
          d.id === demo.id ? { ...d, status: 'completed' as const } : d
        ))
        
        toast({
          title: "Demo marked as complete",
          description: "The demo has been successfully marked as completed.",
        })
      } else {
        throw new Error('Failed to mark demo as complete')
      }
    } catch (error) {
      console.error('Error marking demo as complete:', error)
      toast({
        title: "Error",
        description: "Failed to mark demo as complete. Please try again.",
        variant: "destructive",
      })
    } finally {
      setMarkingComplete(prev => ({ ...prev, [demo.id]: false }))
    }
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

  // Function to generate PDF from prep brief data
  const generatePDF = async (demo: Demo, briefData: { insights: string; pitch: string; next_steps: string }) => {
    try {
      setGeneratingPDF(prev => ({ ...prev, [demo.id]: true }))
      
      const doc = new jsPDF()
      
      // Set document properties
      doc.setProperties({
        title: `Prep Brief - ${demo.merchantName}`,
        subject: 'Demo Preparation Briefing',
        author: aeName,
        creator: 'DemoGenie'
      })

      // Helper function to add section header with background
      const addSectionHeader = (text: string, y: number) => {
        doc.setFillColor(240, 240, 240)
        doc.rect(15, y - 5, 180, 12, 'F')
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(60, 60, 60)
        doc.text(text, 20, y)
        return y + 15
      }

      // Helper function to add field with label
      const addField = (label: string, value: string | undefined, y: number, maxWidth: number = 170) => {
        if (!value || value === 'N/A' || value === 'Not specified') return y
        
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(80, 80, 80)
        doc.text(`${label}:`, 20, y)
        
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(40, 40, 40)
        const lines = doc.splitTextToSize(value, maxWidth)
        doc.text(lines, 25, y + 5)
        
        return y + 5 + (lines.length * 5) + 3
      }

      // Helper function to add content section
      const addContentSection = (title: string, content: string, y: number, maxWidth: number = 170) => {
        if (!content || content === 'N/A' || content === 'Not specified') return y
        
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(60, 60, 60)
        doc.text(title, 20, y)
        
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(40, 40, 40)
        const lines = doc.splitTextToSize(content, maxWidth)
        doc.text(lines, 20, y + 8)
        
        return y + 8 + (lines.length * 5) + 8
      }

      // Helper function to check if we need a new page
      const checkPageBreak = (requiredSpace: number, currentY: number) => {
        const pageHeight = doc.internal.pageSize.height
        if (currentY + requiredSpace > pageHeight - 30) {
          doc.addPage()
          return 20
        }
        return currentY
      }

      let currentY = 20

      // Add main title
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 30, 30)
      doc.text('Demo Preparation Brief', 105, currentY, { align: 'center' })
      currentY += 15

      // Add demo overview
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(80, 80, 80)
      doc.text(`Demo Date: ${new Date(demo.scheduledDateTime).toLocaleDateString()}`, 105, currentY, { align: 'center' })
      currentY += 8
      doc.text(`Time: ${new Date(demo.scheduledDateTime).toLocaleTimeString()}`, 105, currentY, { align: 'center' })
      currentY += 8
      doc.text(`AE: ${demo.aeName}`, 105, currentY, { align: 'center' })
      currentY += 8
      doc.text(`Status: ${demo.status.charAt(0).toUpperCase() + demo.status.slice(1)}`, 105, currentY, { align: 'center' })
      currentY += 20

      // Check if we need a new page for merchant information
      currentY = checkPageBreak(80, currentY)

      // Add merchant information section
      currentY = addSectionHeader('Merchant Information', currentY)
      
      // Basic merchant details
      currentY = addField('Merchant Name', demo.merchantName, currentY)
      currentY = addField('Category', demo.category, currentY)
      currentY = addField('Address', demo.address, currentY)
      currentY = addField('Contact Number', demo.contactNumber, currentY)
      currentY = addField('Email', demo.email, currentY)
      currentY = addField('Website', demo.website, currentY)
      currentY = addField('Social Media', demo.socialMedia, currentY)
      
      // Check if we need a new page for business details
      currentY = checkPageBreak(40, currentY)
      
      // Business details
      currentY = addField('Products Interested', demo.productsInterested, currentY)
      currentY = addField('Number of Outlets', demo.outlets, currentY)
      
      // Check if we need a new page for pain points
      currentY = checkPageBreak(40, currentY)
      
      // Pain points section
      currentY = addSectionHeader('Current Pain Points', currentY)
      currentY = addContentSection('', demo.painPoints || 'No pain points specified', currentY)
      
      // Check if we need a new page for special notes
      if (demo.specialNotes) {
        currentY = checkPageBreak(40, currentY)
        currentY = addSectionHeader('Special Notes', currentY)
        currentY = addContentSection('', demo.specialNotes, currentY)
      }

      // Check if we need a new page for AI insights
      currentY = checkPageBreak(60, currentY)
      
      // AI-Generated Insights section
      currentY = addSectionHeader('AI-Generated Insights', currentY)
      if (briefData.insights) {
        currentY = addContentSection('', briefData.insights, currentY)
      } else {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(120, 120, 120)
        doc.text('No insights available', 20, currentY + 8)
        currentY += 20
      }

      // Check if we need a new page for pitch suggestions
      currentY = checkPageBreak(60, currentY)
      
      // Pitch suggestions section
      currentY = addSectionHeader('Pitch Suggestions', currentY)
      if (briefData.pitch) {
        currentY = addContentSection('', briefData.pitch, currentY)
      } else {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(120, 120, 120)
        doc.text('No pitch suggestions available', 20, currentY + 8)
        currentY += 20
      }

      // Check if we need a new page for next steps
      currentY = checkPageBreak(60, currentY)
      
      // Next steps section
      currentY = addSectionHeader('Next Steps & Features', currentY)
      if (briefData.next_steps) {
        currentY = addContentSection('', briefData.next_steps, currentY)
      } else {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(120, 120, 120)
        doc.text('No next steps available', 20, currentY + 8)
        currentY += 20
      }

      // Check if we need a new page for meeting details
      currentY = checkPageBreak(40, currentY)
      
      // Meeting details section
      currentY = addSectionHeader('Meeting Details', currentY)
      currentY = addField('Meeting Link', demo.meetingLink, currentY)
      
      // Add footer to all pages
      const pageCount = (doc as any).internal.pages.length - 1
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        const pageHeight = doc.internal.pageSize.height
        
        doc.setFontSize(8)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(120, 120, 120)
        doc.text(`Generated by ${aeName} on ${new Date().toLocaleDateString()}`, 20, pageHeight - 20)
        doc.text('DemoGenie - AI-Powered Demo Preparation', 105, pageHeight - 15, { align: 'center' })
        doc.text(`Page ${i} of ${pageCount}`, 105, pageHeight - 10, { align: 'center' })
      }
      
      // Save the PDF
      const fileName = `PrepBrief_${demo.merchantName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
      
      toast({ 
        title: "PDF Generated", 
        description: `Prep brief for ${demo.merchantName} has been downloaded successfully.` 
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({ 
        title: "PDF Generation Failed", 
        description: "There was an error generating the PDF. Please try again.", 
        variant: "destructive" 
      })
    } finally {
      setGeneratingPDF(prev => ({ ...prev, [demo.id]: false }))
    }
  }

  // Function to handle download PDF button click
  const handleDownloadPDF = (demo: Demo) => {
    // Check if prep brief exists
    if (!briefs[demo.id] && demo.prep_brief_status !== "Generated") {
      toast({ 
        title: "No Prep Brief Available", 
        description: "Generate the briefing first before downloading.", 
        variant: "destructive" 
      })
      return
    }
    
    // If brief data is not loaded, load it first
    if (!briefs[demo.id]) {
      handleViewBrief(demo.id).then(() => {
        // After loading, try to generate PDF again
        setTimeout(() => {
          if (briefs[demo.id]) {
            generatePDF(demo, briefs[demo.id]!)
          }
        }, 500)
      })
      return
    }
    
    // Generate PDF with existing data
    generatePDF(demo, briefs[demo.id]!)
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
              Sales Dashboard Login
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
                        {demo.prep_brief_status === "Generated" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewModalOpen(demo.id)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Preview
                          </Button>
                        )}
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
                          <>
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
                            <Dialog open={previewModalOpen === demo.id} onOpenChange={(open) => setPreviewModalOpen(open ? demo.id : null)}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <FileText className="w-4 h-4 mr-2" />
                                  Preview
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto w-[95vw] md:w-auto animate-in fade-in-0 zoom-in-95 duration-200 shadow-2xl bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border/50 rounded-xl">
                                <DialogHeader className="pb-4 border-b border-muted">
                                  <DialogTitle className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                      <FileText className="w-5 h-5 text-primary" />
                                      Prep Brief Preview - {demo.merchantName}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setPreviewModalOpen(null)}
                                      className="h-8 w-8 p-0 hover:bg-muted"
                                    >
                                      <span className="sr-only">Close</span>
                                      ×
                                    </Button>
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-6 px-2">
                                  {/* Header Info */}
                                  <div className="text-center pb-4 border-b border-muted">
                                    <h3 className="text-lg font-semibold text-foreground mb-2">{demo.merchantName}</h3>
                                    <p className="text-sm text-muted-foreground">Demo scheduled for {new Date(demo.scheduledDateTime).toLocaleDateString()}</p>
                                  </div>
                                  
                                  {/* Merchant Information */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gradient-to-br from-muted/30 to-muted/50 rounded-lg border">
                                    <div className="space-y-4">
                                      <h5 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Contact Details</h5>
                                      <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                          <MapPin className="w-4 h-4 text-primary" />
                                          <div>
                                            <span className="text-xs font-medium text-muted-foreground uppercase">Address</span>
                                            <p className="text-sm">{demo.address || 'Not specified'}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <Phone className="w-4 h-4 text-primary" />
                                          <div>
                                            <span className="text-xs font-medium text-muted-foreground uppercase">Contact</span>
                                            <p className="text-sm">{demo.contactNumber || 'Not specified'}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <Mail className="w-4 h-4 text-primary" />
                                          <div>
                                            <span className="text-xs font-medium text-muted-foreground uppercase">Email</span>
                                            <p className="text-sm">{demo.email || 'Not specified'}</p>
                                          </div>
                                        </div>
                                        {demo.website && (
                                          <div className="flex items-center gap-3">
                                            <Globe className="w-4 h-4 text-primary" />
                                            <div>
                                              <span className="text-xs font-medium text-muted-foreground uppercase">Website</span>
                                              <a
                                                href={demo.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-primary hover:underline"
                                              >
                                                {demo.website}
                                              </a>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="space-y-4">
                                      <h5 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Business Details</h5>
                                      <div className="space-y-3">
                                        <div>
                                          <span className="text-xs font-medium text-muted-foreground uppercase">Category</span>
                                          <p className="text-sm">{demo.category || 'Not specified'}</p>
                                        </div>
                                        <div>
                                          <span className="text-xs font-medium text-muted-foreground uppercase">Products Interested</span>
                                          <p className="text-sm">{demo.productsInterested || 'Not specified'}</p>
                                        </div>
                                        <div>
                                          <span className="text-xs font-medium text-muted-foreground uppercase">Number of Outlets</span>
                                          <p className="text-sm">{demo.outlets || 'Not specified'}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Pain Points */}
                                  <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-800">
                                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                      Current Pain Points
                                    </h4>
                                    <p className="text-sm text-red-700">{demo.painPoints || 'No pain points specified'}</p>
                                  </div>

                                  {/* AI-Generated Insights */}
                                  {briefs[demo.id] ? (
                                    <div className="space-y-4">
                                      <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-800">
                                          <Sparkles className="w-4 h-4 text-blue-600" />
                                          AI-Generated Insights
                                        </h4>
                                        <p className="text-sm text-blue-700 whitespace-pre-wrap">{briefs[demo.id]?.insights || 'No insights available'}</p>
                                      </div>
                                      
                                      <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-800">
                                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                          Pitch Suggestions
                                        </h4>
                                        <p className="text-sm text-green-700 whitespace-pre-wrap">{briefs[demo.id]?.pitch || 'No pitch suggestions available'}</p>
                                      </div>
                                      
                                      <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-purple-800">
                                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                          Next Steps & Features
                                        </h4>
                                        <p className="text-sm text-purple-700 whitespace-pre-wrap">{briefs[demo.id]?.next_steps || 'No next steps available'}</p>
                                      </div>
                                    </div>
                                  ) : demo.prep_brief_status === "Generated" ? (
                                    <div className="p-6 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                                      <div className="text-center">
                                        <FileText className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground mb-3">Prep brief data not loaded yet</p>
                                        <Button
                                          size="sm"
                                          onClick={() => handleViewBrief(demo.id)}
                                          disabled={!!viewing[demo.id]}
                                        >
                                          {viewing[demo.id] ? (
                                            <>
                                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                              Loading...
                                            </>
                                          ) : (
                                            <>
                                              <ExternalLink className="w-4 h-4 mr-2" />
                                              Load Brief Data
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="p-6 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                                      <div className="text-center">
                                        <Sparkles className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground mb-3">No prep brief available yet</p>
                                        <p className="text-xs text-muted-foreground mb-4">Generate a prep brief to see AI insights and suggestions</p>
                                        <Button
                                          size="sm"
                                          onClick={() => handleGenerateBrief(demo.id)}
                                          disabled={!!generating[demo.id]}
                                        >
                                          {generating[demo.id] ? (
                                            <>
                                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                              Generating...
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
                                  )}

                                  {/* Special Notes */}
                                  {demo.specialNotes && (
                                    <div className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-amber-800">
                                        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                                        Special Notes
                                      </h4>
                                      <p className="text-sm text-amber-700">{demo.specialNotes}</p>
                                    </div>
                                  )}

                                  {/* Action Buttons */}
                                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-muted">
                                    <Button 
                                      onClick={() => generatePDF(demo, briefs[demo.id]!)}
                                      className="flex-1 h-12 text-sm"
                                      disabled={!briefs[demo.id] || !!generatingPDF[demo.id]}
                                    >
                                      {generatingPDF[demo.id] ? (
                                        <>
                                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                          Generating PDF...
                                        </>
                                      ) : (
                                        <>
                                          <Download className="w-4 h-4 mr-2" />
                                          Download PDF
                                        </>
                                      )}
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      onClick={() => setPreviewModalOpen(null)}
                                      className="flex-1 h-12 text-sm"
                                    >
                                      Close Preview
                                    </Button>
                                  </div>
                                  
                                  {/* Help Text */}
                                  {!briefs[demo.id] && demo.prep_brief_status === "Generated" && (
                                    <div className="text-center pt-2">
                                      <p className="text-xs text-muted-foreground">
                                        💡 Load the brief data first to enable PDF download
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
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
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDownloadPDF(demo)}
                          disabled={demo.prep_brief_status !== "Generated" || !!generatingPDF[demo.id]}
                        >
                          {generatingPDF[demo.id] ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating PDF...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Download PDF
                            </>
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleMarkComplete(demo)}
                          disabled={demo.status === "completed" || !!markingComplete[demo.id]}
                        >
                          {markingComplete[demo.id] ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Marking...
                            </>
                          ) : demo.status === "completed" ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                              Completed
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark Complete
                            </>
                          )}
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
                        <div className="space-y-4 text-sm">
                          <div>
                            <Label className="font-medium text-primary">Company Insights & Pain Points</Label>
                            <p className="text-muted-foreground whitespace-pre-wrap mt-1">{briefs[demo.id]?.insights}</p>
                          </div>
                          <div>
                            <Label className="font-medium text-primary">Pitch Strategy</Label>
                            <p className="text-muted-foreground whitespace-pre-wrap mt-1">{briefs[demo.id]?.pitch}</p>
                          </div>
                          <div>
                            <Label className="font-medium text-primary">Product Features & Next Steps</Label>
                            <p className="text-muted-foreground whitespace-pre-wrap mt-1">{briefs[demo.id]?.next_steps}</p>
                          </div>
                        </div>
                      ) : demo.prep_brief_status === "Generated" ? (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">Click "View Brief" to load the latest prep brief.</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewModalOpen(demo.id)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Preview Brief
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">No brief yet. Generate one to get started.</p>
                          <div className="relative group">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download PDF
                            </Button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                              Generate a prep brief first
                            </div>
                          </div>
                        </div>
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
