import { NextResponse } from 'next/server'
import { mockRecentActivity } from '@/mocks/data/overview'

const baseDate = new Date('2026-03-22')

function makeDayEntry(daysAgo: number) {
  const d = new Date(baseDate)
  d.setDate(d.getDate() + daysAgo)
  return {
    date: d.toISOString().slice(0, 10),
    sends: Math.floor(120_000 + Math.random() * 60_000),
  }
}

export async function GET() {
  const sendsPerDay = Array.from({ length: 7 }, (_, i) => makeDayEntry(i))

  return NextResponse.json({
    total_protocols: 25,
    total_protocols_delta: 3,
    sends_today: 1_847_293,
    sends_today_delta: 12.4,
    delivery_rate_24h: 97.3,
    delivery_rate_delta: -0.4,
    open_incidents: 1,
    sends_per_day: sendsPerDay,
    recent_activity: mockRecentActivity,
  })
}

