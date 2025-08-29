"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Users, Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl md:text-6xl font-bold text-gradient">DemoGenie</h1>
          </div>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto text-balance">
            AI-Powered Demo Booking & Preparation Assistant
          </p>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto text-pretty">
            Streamline your demo process with intelligent booking and automated preparation briefs
          </p>
        </div>

        {/* Main Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Merchant Card */}
          <Link href="/merchant">
            <Card className="glass hover-glow cursor-pointer h-full">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Book a Demo</h2>
                <p className="text-muted-foreground mb-6 text-pretty">
                  Schedule a personalized demo with our Account Executives. Get tailored solutions for your restaurant
                  business.
                </p>
                <Button className="w-full group">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* AE Dashboard Card */}
          <Link href="/ae">
            <Card className="glass hover-glow cursor-pointer h-full">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Sales Dashboard</h2>
                <p className="text-muted-foreground mb-6 text-pretty">
                  Access your demo pipeline, preparation briefs, and calendar. Manage your prospects with AI-powered
                  insights.
                </p>
                <Button variant="secondary" className="w-full group">
                  View Dashboard
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Features Section */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold mb-8">Powered by AI Intelligence</h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="glass">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Smart Scheduling</h4>
                <p className="text-sm text-muted-foreground">
                  Intelligent calendar management with automated AE assignment
                </p>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <h4 className="font-semibold mb-2">Prep Briefs</h4>
                <p className="text-sm text-muted-foreground">AI-generated preparation briefs with company insights</p>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-6 h-6 text-accent" />
                </div>
                <h4 className="font-semibold mb-2">Pipeline Management</h4>
                <p className="text-sm text-muted-foreground">Complete demo lifecycle tracking and analytics</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
