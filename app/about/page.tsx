import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Users, Heart, Shield, Globe, Award } from "lucide-react"

export default function AboutPage() {
  const teamMembers = [
    {
      name: "Sarah Johnson",
      role: "Founder & CEO",
      bio: "Sarah has 10+ years of experience in nonprofit management and fundraising.",
      image: "/placeholder.svg?height=300&width=300",
    },
    {
      name: "Michael Chen",
      role: "CTO",
      bio: "Michael brings 15 years of tech leadership experience to the FundFlow platform.",
      image: "/placeholder.svg?height=300&width=300",
    },
    {
      name: "Aisha Patel",
      role: "Head of Community",
      bio: "Aisha has dedicated her career to building and supporting community initiatives.",
      image: "/placeholder.svg?height=300&width=300",
    },
    {
      name: "David Rodriguez",
      role: "Chief Financial Officer",
      bio: "David oversees all financial operations and ensures transparency in our platform.",
      image: "/placeholder.svg?height=300&width=300",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">About FundFlow</h1>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our mission is to empower individuals and organizations to raise funds for causes that matter.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <img
                src="/placeholder.svg?height=400&width=600"
                alt="Our story"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
                width={600}
                height={400}
              />
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Our Story</h2>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    FundFlow was founded in 2020 with a simple idea: make fundraising accessible to everyone.
                  </p>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    What started as a small project to help local communities raise funds for important causes has grown
                    into a global platform connecting donors with fundraisers around the world.
                  </p>
                  <p>
                    Our team is passionate about creating technology that empowers people to make a difference. We
                    believe that everyone should have the tools they need to raise funds for what matters to them,
                    whether it's a community project, medical expenses, or a creative endeavor.
                  </p>
                  <p>
                    Today, FundFlow has helped raise over $50 million for causes in more than 30 countries, and we're
                    just getting started.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Our Values</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  The principles that guide everything we do at FundFlow.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardContent className="flex flex-col items-center space-y-4 p-6">
                  <Heart className="h-12 w-12 text-primary" />
                  <h3 className="text-xl font-bold">Compassion</h3>
                  <p className="text-center text-muted-foreground">
                    We believe in the power of empathy and understanding to drive positive change in the world.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center space-y-4 p-6">
                  <Shield className="h-12 w-12 text-primary" />
                  <h3 className="text-xl font-bold">Trust</h3>
                  <p className="text-center text-muted-foreground">
                    We're committed to transparency and security in every aspect of our platform.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center space-y-4 p-6">
                  <Users className="h-12 w-12 text-primary" />
                  <h3 className="text-xl font-bold">Community</h3>
                  <p className="text-center text-muted-foreground">
                    We foster connections between people who want to make a difference.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center space-y-4 p-6">
                  <Globe className="h-12 w-12 text-primary" />
                  <h3 className="text-xl font-bold">Accessibility</h3>
                  <p className="text-center text-muted-foreground">
                    We make fundraising tools available to everyone, regardless of background or location.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center space-y-4 p-6">
                  <TrendingUp className="h-12 w-12 text-primary" />
                  <h3 className="text-xl font-bold">Innovation</h3>
                  <p className="text-center text-muted-foreground">
                    We continuously improve our platform to better serve our users' needs.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center space-y-4 p-6">
                  <Award className="h-12 w-12 text-primary" />
                  <h3 className="text-xl font-bold">Impact</h3>
                  <p className="text-center text-muted-foreground">
                    We measure our success by the positive change we help create in communities worldwide.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Our Team</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Meet the passionate people behind FundFlow.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 md:grid-cols-2 lg:grid-cols-4">
              {teamMembers.map((member, index) => (
                <div key={index} className="flex flex-col items-center space-y-4">
                  <img
                    src={member.image || "/placeholder.svg"}
                    alt={member.name}
                    className="aspect-square w-full rounded-full object-cover"
                    width={300}
                    height={300}
                  />
                  <div className="space-y-2 text-center">
                    <h3 className="text-xl font-bold">{member.name}</h3>
                    <p className="text-sm font-medium text-primary">{member.role}</p>
                    <p className="text-sm text-muted-foreground">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Join Our Mission</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Ready to make a difference? Start your fundraising journey today.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/events/create">
                  <Button size="lg">Start Fundraising</Button>
                </Link>
                <Link href="/events">
                  <Button variant="outline" size="lg">
                    Explore Events
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            <span className="text-xl font-bold">FundFlow</span>
          </div>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            © {new Date().getFullYear()} FundFlow. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/terms" className="text-sm text-muted-foreground hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:underline">
              Privacy
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:underline">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
