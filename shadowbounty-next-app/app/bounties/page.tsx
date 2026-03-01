"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { BountyList } from "@/components/bounty-list"
import { Search, Filter } from "lucide-react"

export default function BountiesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    prizeRange: "all",
    expiry: "all",
    mySkills: false,
  })
  const [userSkills, setUserSkills] = useState<string[]>([])

  useEffect(() => {
    // Simulating fetching user skills from GitHub
    setUserSkills(["JavaScript", "TypeScript", "Solidity"])
  }, [])

  // Mock data for bounties
  const bounties = [
    {
      id: "1",
      title: "Implement Smart Contract for Token Staking",
      description: "Design a secure, upgradeable Solidity staking contract with reward distribution and slashing.",
      prize: 800,
      expiresIn: "5 days",
      status: "active",
      saved: false,
      skills: ["Solidity", "Smart Contracts", "Security"],
    },
    {
      id: "2",
      title: "Build React Component for Wallet Connection",
      description:
        "Develop a robust, extensible React wallet connector supporting Metamask, WalletConnect, and error recovery.",
      prize: 550,
      expiresIn: "2 days",
      status: "active",
      saved: false,
      skills: ["React", "TypeScript", "Web3"],
    },
    {
      id: "3",
      title: "Optimize Gas Usage in NFT Contract",
      description: "Perform deep gas profiling and refactor NFT contract using assembly optimizations and batch minting.",
      prize: 1200,
      expiresIn: "1 day",
      status: "active",
      saved: false,
      skills: ["Solidity", "Gas Optimization", "Assembly"],
    },
    {
      id: "4",
      title: "Create API Integration for Token Prices",
      description: "Implement a fault-tolerant backend service aggregating token prices with caching and rate-limit handling.",
      prize: 700,
      expiresIn: "3 days",
      status: "active",
      saved: false,
      skills: ["Node.js", "API Integration", "Reliability"],
    },
    {
      id: "5",
      title: "Build Discord Bot Integration",
      description: "Design a stateful Discord bot with real-time updates, command handling, and sharding support.",
      prize: 650,
      expiresIn: "7 days",
      status: "active",
      saved: false,
      skills: ["JavaScript", "Discord API", "Scalability"],
    },
  ]

  // Filter bounties based on search and filters
  const filteredBounties = bounties.filter((bounty) => {
    // Search filter
    if (
      searchQuery &&
      !bounty.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !bounty.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }

    // Prize range filter
    if (filters.prizeRange === "under300" && bounty.prize >= 300) return false
    if (filters.prizeRange === "300to500" && (bounty.prize < 300 || bounty.prize > 500)) return false
    if (filters.prizeRange === "over500" && bounty.prize <= 500) return false

    // Expiry filter
    if (filters.expiry === "24h" && !bounty.expiresIn.includes("1 day")) return false
    if (filters.expiry === "48h" && !(bounty.expiresIn.includes("1 day") || bounty.expiresIn.includes("2 day")))
      return false
    if (
      filters.expiry === "7d" &&
      !(
        bounty.expiresIn.includes("1 day") ||
        bounty.expiresIn.includes("2 day") ||
        bounty.expiresIn.includes("3 day") ||
        bounty.expiresIn.includes("4 day") ||
        bounty.expiresIn.includes("5 day") ||
        bounty.expiresIn.includes("6 day") ||
        bounty.expiresIn.includes("7 day")
      )
    )
      return false

    // My skills filter
    if (filters.mySkills && !bounty.skills.some((skill) => userSkills.includes(skill))) {
      return false
    }

    return true
  })

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="font-bold text-xl">
              ShadowBounty
            </Link>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium hover:underline">
              Dashboard
            </Link>
            <Link href="/auth">
              <Button size="sm">Sign In</Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 py-6">
        <div className="container">
          <div className="flex flex-col space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Explore Bounties</h1>
              <p className="text-muted-foreground">Find bounties that match your skills and interests</p>
            </div>

            <div className="flex flex-col gap-4 md:flex-row">
              <div className="md:w-1/4 space-y-4">
                <div className="rounded-lg border p-4">
                  <h2 className="font-medium mb-3 flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </h2>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="prizeRange">Prize Range</Label>
                      <Select
                        value={filters.prizeRange}
                        onValueChange={(value) => setFilters({ ...filters, prizeRange: value })}
                      >
                        <SelectTrigger id="prizeRange">
                          <SelectValue placeholder="All Prizes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Prizes</SelectItem>
                          <SelectItem value="under300">Under $300</SelectItem>
                          <SelectItem value="300to500">$300 - $500</SelectItem>
                          <SelectItem value="over500">Over $500</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry</Label>
                      <Select
                        value={filters.expiry}
                        onValueChange={(value) => setFilters({ ...filters, expiry: value })}
                      >
                        <SelectTrigger id="expiry">
                          <SelectValue placeholder="Any Time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any Time</SelectItem>
                          <SelectItem value="24h">Next 24 hours</SelectItem>
                          <SelectItem value="48h">Next 48 hours</SelectItem>
                          <SelectItem value="7d">Next 7 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="mySkills"
                        checked={filters.mySkills}
                        onCheckedChange={(checked) => setFilters({ ...filters, mySkills: checked as boolean })}
                      />
                      <Label htmlFor="mySkills">Match My Skills</Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:w-3/4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search bounties..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("")
                      setFilters({
                        prizeRange: "all",
                        expiry: "all",
                        mySkills: false,
                      })
                    }}
                  >
                    Reset
                  </Button>
                </div>

                <div className="rounded-md bg-muted p-3">
                  <p className="text-sm">
                    Showing {filteredBounties.length} of {bounties.length} bounties
                  </p>
                </div>

                <BountyList bounties={filteredBounties} actionLabel="View Details" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

